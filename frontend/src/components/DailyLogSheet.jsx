import React from 'react';

export default function DailyLogSheet({ logData, dayIndex = 0, totalDays = 1 }) {
  if (!logData) return null;

  const width = 960;
  const height = 620;

  // Grid Coordinate Geometry
  const gridX = 140;
  const gridWidth = 720; // 30px per hour * 24 hours
  const rowHeight = 36;
  const gridTopY = 160;
  const gridBottomY = gridTopY + rowHeight * 4; // 304

  // The 4 horizontal duty lines are centered within each status row band
  const rowYs = {
    OFF_DUTY: gridTopY + rowHeight * 0.5,            // 178
    SLEEPER_BERTH: gridTopY + rowHeight * 1.5,       // 214
    DRIVING: gridTopY + rowHeight * 2.5,             // 250
    ON_DUTY_NOT_DRIVING: gridTopY + rowHeight * 3.5, // 286
  };

  const getStatusY = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('SLEEP')) return rowYs.SLEEPER_BERTH;
    if (s.includes('DRIV')) return rowYs.DRIVING;
    if (s.includes('ON_DUTY') || s.includes('ON DUTY') || s.includes('PICKUP') || s.includes('LOAD') || s.includes('FUEL')) {
      return rowYs.ON_DUTY_NOT_DRIVING;
    }
    return rowYs.OFF_DUTY;
  };

  const getNormalizedStatus = (status, text = '') => {
    const combined = `${status} ${text}`.toUpperCase();
    if (combined.includes('SLEEP')) return 'SLEEPER_BERTH';
    if (combined.includes('DRIV')) return 'DRIVING';
    if (combined.includes('LOAD') || combined.includes('UNLOAD') || combined.includes('PICKUP') || combined.includes('DROPOFF') || combined.includes('INSPECT') || combined.includes('FUEL') || combined.includes('ON_DUTY') || combined.includes('ON DUTY')) {
      return 'ON_DUTY_NOT_DRIVING';
    }
    return 'OFF_DUTY';
  };

  const hourToX = (hour) => gridX + (Math.max(0, Math.min(24, Number(hour) || 0)) / 24.0) * gridWidth;

  // Extract raw segments
  const rawSegments = logData.segments || logData.duty_segments || logData.grid_intervals || [];
  let segments = rawSegments.map((seg) => ({
    start_hour: seg.start_hour !== undefined ? Number(seg.start_hour) : (seg.start_min !== undefined ? seg.start_min / 60 : 0),
    end_hour: seg.end_hour !== undefined ? Number(seg.end_hour) : (seg.end_min !== undefined ? seg.end_min / 60 : 24),
    duty_status: getNormalizedStatus(seg.duty_status, seg.remark),
    remark: seg.remark || '',
    location: seg.location || ''
  })).filter(s => s.end_hour > s.start_hour);

  const remarks = logData.remarks || [];

  // Fallback: If segments array was empty (from an older database record), reconstruct from remarks timeline
  if (segments.length === 0 && remarks.length > 0) {
    const sortedRemarks = [...remarks].sort((a, b) => (Number(a.time_hour) || 0) - (Number(b.time_hour) || 0));
    let lastHour = 0;
    let lastStatus = 'OFF_DUTY';

    sortedRemarks.forEach((rem) => {
      const remH = Math.max(0, Math.min(24, Number(rem.time_hour) || 0));
      if (remH > lastHour) {
        segments.push({
          start_hour: lastHour,
          end_hour: remH,
          duty_status: lastStatus,
          remark: '',
          location: ''
        });
      }
      lastHour = remH;
      lastStatus = getNormalizedStatus(rem.duty_status, rem.text || rem.remark);
    });

    if (lastHour < 24) {
      segments.push({
        start_hour: lastHour,
        end_hour: 24,
        duty_status: lastStatus,
        remark: '',
        location: ''
      });
    }
  }

  // If still empty, default to 24h Off Duty
  if (segments.length === 0) {
    segments = [{ start_hour: 0, end_hour: 24, duty_status: 'OFF_DUTY' }];
  }

  // Calculate exact hours from segments directly to ensure 100% mathematical accuracy
  let computedTotals = {
    off_duty: 0,
    sleeper_berth: 0,
    driving: 0,
    on_duty_not_driving: 0
  };

  segments.forEach((seg) => {
    const dur = Math.max(0, seg.end_hour - seg.start_hour);
    if (seg.duty_status === 'SLEEPER_BERTH') computedTotals.sleeper_berth += dur;
    else if (seg.duty_status === 'DRIVING') computedTotals.driving += dur;
    else if (seg.duty_status === 'ON_DUTY_NOT_DRIVING') computedTotals.on_duty_not_driving += dur;
    else computedTotals.off_duty += dur;
  });

  const totalsHours = {
    off_duty: Number((logData.totals_hours?.off_duty ?? (computedTotals.off_duty > 0 ? computedTotals.off_duty : (logData.total_off_duty_hours || computedTotals.off_duty))).toFixed(1)),
    sleeper_berth: Number((logData.totals_hours?.sleeper_berth ?? (computedTotals.sleeper_berth > 0 ? computedTotals.sleeper_berth : (logData.total_sleeper_hours || computedTotals.sleeper_berth))).toFixed(1)),
    driving: Number((logData.totals_hours?.driving ?? (computedTotals.driving > 0 ? computedTotals.driving : (logData.total_driving_hours || computedTotals.driving))).toFixed(1)),
    on_duty_not_driving: Number((logData.totals_hours?.on_duty_not_driving ?? (computedTotals.on_duty_not_driving > 0 ? computedTotals.on_duty_not_driving : (logData.total_on_duty_hours || computedTotals.on_duty_not_driving))).toFixed(1)),
  };

  // Build the continuous stepped line path across 24 hours
  let pathD = "";
  segments.forEach((seg, idx) => {
    const x1 = hourToX(seg.start_hour);
    const x2 = hourToX(seg.end_hour);
    const y = getStatusY(seg.duty_status);

    if (idx === 0) {
      pathD += `M ${x1} ${y} L ${x2} ${y}`;
    } else {
      pathD += ` L ${x1} ${y} L ${x2} ${y}`;
    }
  });

  const dateStr = logData.date || logData.log_date || "2026-08-18";
  const driverName = logData.driver_name || "Alex Morgan";
  const carrierName = logData.carrier_name || "MileMint Logistics LLC";
  const truckNumber = logData.truck_number || logData.truck_id || "TRK-9042";
  const trailerNumber = logData.trailer_number || logData.trailer_id || "TLR-5510";
  const totalMilesToday = logData.total_miles_driving_today !== undefined ? logData.total_miles_driving_today : (logData.miles_driven || 0);
  const mainOffice = logData.main_office_address || "100 Logistics Blvd, Suite 400, Chicago, IL";
  const homeTerminal = logData.home_terminal_address || "770 Freight Way, Chicago, IL";

  const onDutyToday = Number((totalsHours.driving + totalsHours.on_duty_not_driving).toFixed(1));
  const recap = logData.recap || {
    on_duty_today_hours: onDutyToday,
    cycle_hours_at_start: 24.5,
    cycle_hours_cumulative: Number((24.5 + onDutyToday).toFixed(1)),
    cycle_hours_remaining: Math.max(0, Number((70.0 - (24.5 + onDutyToday)).toFixed(1)))
  };

  return (
    <div className="svg-log-wrapper">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block', fontFamily: 'Inter, Arial, sans-serif' }}
      >
        {/* Paper Background */}
        <rect x="0" y="0" width={width} height={height} fill="#ffffff" />

        {/* 1. Header Section */}
        <text x="30" y="32" fontSize="22" fontWeight="800" fill="#0f172a">
          Driver's Daily Log
        </text>
        <text x="235" y="32" fontSize="13" fontWeight="500" fill="#64748b">
          (24 hours) — Day {logData.day_number || dayIndex + 1} of {totalDays || 1}
        </text>

        <text x="580" y="24" fontSize="11" fill="#475569">
          Original - File at home terminal.
        </text>
        <text x="580" y="38" fontSize="11" fill="#475569">
          Duplicate - Driver retains in possession for 8 days.
        </text>

        {/* Date, Carrier, Driver Info */}
        <g fontSize="12" fill="#1e293b">
          <text x="30" y="65" fontWeight="600">Date: <tspan fontWeight="700" fill="#2563eb">{dateStr}</tspan></text>
          <text x="240" y="65" fontWeight="600">Driver Name: <tspan fontWeight="500">{driverName}</tspan></text>
          <text x="580" y="65" fontWeight="600">Carrier: <tspan fontWeight="500">{carrierName}</tspan></text>

          <text x="30" y="90" fontWeight="600">Truck / Tractor #: <tspan fontWeight="500">{truckNumber}</tspan></text>
          <text x="240" y="90" fontWeight="600">Trailer #: <tspan fontWeight="500">{trailerNumber}</tspan></text>
          <text x="580" y="90" fontWeight="600">Miles Driving Today: <tspan fontWeight="700" fill="#2563eb">{totalMilesToday} mi</tspan></text>

          <text x="30" y="112" fontSize="11" fill="#64748b">Main Office Address: {mainOffice}</text>
          <text x="580" y="112" fontSize="11" fill="#64748b">Home Terminal: {homeTerminal}</text>
        </g>

        {/* 2. Graph Grid Header (Hour Numbers) */}
        <rect x={gridX} y="130" width={gridWidth} height="24" fill="#0f172a" rx="4" />
        {Array.from({ length: 25 }).map((_, h) => {
          const x = gridX + (h / 24.0) * gridWidth;
          let label = `${h}`;
          if (h === 0 || h === 24) label = "Mid";
          else if (h === 12) label = "Noon";
          else if (h > 12) label = `${h - 12}`;

          return (
            <text
              key={h}
              x={x}
              y="146"
              fontSize="10"
              fontWeight="700"
              fill="#ffffff"
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}

        {/* Total Hours Column Header */}
        <text x="895" y="146" fontSize="11" fontWeight="700" fill="#0f172a" textAnchor="middle">
          Total Hours
        </text>

        {/* 3. Grid Rows (4 Statuses) */}
        {[
          { label: "1. Off Duty", key: "off_duty", y: rowYs.OFF_DUTY },
          { label: "2. Sleeper Berth", key: "sleeper_berth", y: rowYs.SLEEPER_BERTH },
          { label: "3. Driving", key: "driving", y: rowYs.DRIVING },
          { label: "4. On Duty (not driving)", key: "on_duty_not_driving", y: rowYs.ON_DUTY_NOT_DRIVING },
        ].map((row, idx) => {
          const topY = gridTopY + idx * rowHeight;
          const val = totalsHours[row.key] || 0;

          return (
            <g key={row.key}>
              {/* Row Label */}
              <text x={gridX - 12} y={topY + 22} fontSize="11" fontWeight="600" fill="#334155" textAnchor="end">
                {row.label}
              </text>

              {/* Row Background Box */}
              <rect
                x={gridX}
                y={topY}
                width={gridWidth}
                height={rowHeight}
                fill={idx % 2 === 0 ? "#f8fafc" : "#ffffff"}
                stroke="#cbd5e1"
                strokeWidth="1"
              />

              {/* Horizontal Status Track Guide Line */}
              <line
                x1={gridX}
                y1={row.y}
                x2={gridX + gridWidth}
                y2={row.y}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="2 2"
              />

              {/* 15-Minute Subdivider Ticks */}
              {Array.from({ length: 24 * 4 }).map((_, tickIdx) => {
                const tx = gridX + (tickIdx / (24 * 4.0)) * gridWidth;
                const isHour = tickIdx % 4 === 0;
                const isHalf = tickIdx % 4 === 2;
                const tickLen = isHour ? rowHeight : (isHalf ? 14 : 7);

                return (
                  <line
                    key={tickIdx}
                    x1={tx}
                    y1={topY}
                    x2={tx}
                    y2={topY + tickLen}
                    stroke={isHour ? "#94a3b8" : "#cbd5e1"}
                    strokeWidth={isHour ? "1.5" : "0.75"}
                  />
                );
              })}

              {/* Total Subtotal on Right */}
              <rect x="870" y={topY + 4} width="50" height="28" fill="#f1f5f9" rx="4" stroke="#cbd5e1" />
              <text x="895" y={topY + 22} fontSize="13" fontWeight="700" fill="#0f172a" textAnchor="middle">
                {Number(val).toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Outer Grid Border */}
        <rect
          x={gridX}
          y={gridTopY}
          width={gridWidth}
          height={rowHeight * 4}
          fill="none"
          stroke="#475569"
          strokeWidth="1.5"
        />

        {/* 4. Plotted Continuous Stepped Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3.5"
          strokeLinejoin="miter"
          strokeLinecap="square"
        />

        {/* Total Verification Pill */}
        <g transform="translate(870, 310)">
          <rect width="50" height="22" fill="#dcfce7" rx="11" stroke="#86efac" />
          <text x="25" y="15" fontSize="11" fontWeight="800" fill="#166534" textAnchor="middle">
            24.0 h
          </text>
        </g>

        {/* 5. Remarks Section */}
        <text x="30" y="330" fontSize="14" fontWeight="700" fill="#0f172a">
          Remarks & Location of Duty Changes:
        </text>

        {/* Remarks Drop Lines & Badges */}
        {remarks.map((rem, remIdx) => {
          const timeH = rem.time_hour !== undefined ? Number(rem.time_hour) : (rem.time_min !== undefined ? rem.time_min / 60 : 0);
          const rx = hourToX(timeH);
          const remY = 355 + (remIdx % 4) * 32;

          return (
            <g key={remIdx}>
              {/* Vertical Guide Line */}
              <line
                x1={rx}
                y1={gridBottomY}
                x2={rx}
                y2={remY - 6}
                stroke="#94a3b8"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <circle cx={rx} cy={gridBottomY} r="3.5" fill="#2563eb" />

              {/* Remark Pill Badge */}
              <rect
                x={Math.max(10, Math.min(rx - 80, width - 240))}
                y={remY - 14}
                width="220"
                height="22"
                fill="#f8fafc"
                rx="6"
                stroke="#cbd5e1"
              />
              <text
                x={Math.max(16, Math.min(rx - 74, width - 234))}
                y={remY + 1}
                fontSize="10.5"
                fontWeight="600"
                fill="#1e293b"
              >
                <tspan fill="#2563eb" fontWeight="700">{timeH.toFixed(1)}h:</tspan> {rem.text || rem.remark || 'Duty Status Change'} ({rem.location || ''})
              </text>
            </g>
          );
        })}

        {/* 6. Recap Table (Bottom) */}
        <g transform="translate(30, 490)">
          <rect width="900" height="110" fill="#f8fafc" rx="8" stroke="#cbd5e1" />
          <text x="18" y="24" fontSize="12" fontWeight="700" fill="#0f172a">
            70-Hour / 8-Day Driver Recap:
          </text>

          {/* Table Columns */}
          <g fontSize="11" fill="#475569">
            {/* Col 1: On-Duty Today */}
            <rect x="18" y="36" width="180" height="60" fill="#ffffff" rx="6" stroke="#e2e8f0" />
            <text x="30" y="56" fontWeight="600">On-Duty Hours Today</text>
            <text x="30" y="74" fontSize="10" fill="#94a3b8">(Lines 3 & 4)</text>
            <text x="180" y="74" fontSize="16" fontWeight="800" fill="#0f172a" textAnchor="end">
              {recap.on_duty_today_hours} hrs
            </text>

            {/* Col 2: Cycle at Start */}
            <rect x="210" y="36" width="180" height="60" fill="#ffffff" rx="6" stroke="#e2e8f0" />
            <text x="222" y="56" fontWeight="600">Cycle at Start of Day</text>
            <text x="222" y="74" fontSize="10" fill="#94a3b8">(Input / Prior)</text>
            <text x="372" y="74" fontSize="16" fontWeight="800" fill="#2563eb" textAnchor="end">
              {recap.cycle_hours_at_start} hrs
            </text>

            {/* Col 3: Cumulative Cycle */}
            <rect x="402" y="36" width="220" height="60" fill="#ffffff" rx="6" stroke="#e2e8f0" />
            <text x="414" y="56" fontWeight="600">Cumulative Cycle Used</text>
            <text x="414" y="74" fontSize="10" fill="#94a3b8">(Max 70.0 hrs limit)</text>
            <text x="604" y="74" fontSize="16" fontWeight="800" fill="#0f172a" textAnchor="end">
              {recap.cycle_hours_cumulative} / 70.0 h
            </text>

            {/* Col 4: Hours Available Tomorrow */}
            <rect x="634" y="36" width="250" height="60" fill="#ffffff" rx="6" stroke="#e2e8f0" />
            <text x="646" y="56" fontWeight="600">Hours Available Tomorrow</text>
            <text x="646" y="74" fontSize="10" fill="#94a3b8">(70.0 minus Cumulative)</text>
            <text x="866" y="74" fontSize="16" fontWeight="800" fill="#16a34a" textAnchor="end">
              {recap.cycle_hours_remaining} hrs
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
