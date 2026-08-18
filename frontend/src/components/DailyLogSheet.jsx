import React from 'react';

const normalizePaperStatus = (status, text = '') => {
  const value = `${status} ${text}`.toUpperCase();
  if (value.includes('SLEEP')) return 'SLEEPER_BERTH';
  if (value.includes('DRIV')) return 'DRIVING';
  if (value.includes('LOAD') || value.includes('UNLOAD') || value.includes('PICKUP') || value.includes('DROPOFF') || value.includes('INSPECT') || value.includes('FUEL') || value.includes('ON_DUTY') || value.includes('ON DUTY')) return 'ON_DUTY_NOT_DRIVING';
  return 'OFF_DUTY';
};

function PrintablePaperLog({ logData, segments, totalsHours, recap, totalMilesToday }) {
  const date = new Date(`${logData.date || logData.log_date || '2026-08-18'}T12:00:00`);
  const isValidDate = !Number.isNaN(date.valueOf());
  const dateParts = isValidDate
    ? [String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0'), String(date.getFullYear())]
    : ['', '', ''];
  const remarks = logData.remarks || [];
  const routeParts = String(logData.trip_route || '').split(/(?:→|->)/).map((part) => part.trim()).filter(Boolean);
  const from = logData.from_location || routeParts[0] || remarks[0]?.location || '';
  const to = logData.to_location || routeParts[routeParts.length - 1] || remarks[remarks.length - 1]?.location || '';
  const paperX = (hour) => 55 + (Math.max(0, Math.min(24, Number(hour) || 0)) / 24) * 400;
  const paperY = {
    OFF_DUTY: 194,
    SLEEPER_BERTH: 211,
    DRIVING: 228,
    ON_DUTY_NOT_DRIVING: 245
  };
  let dutyPath = '';
  segments.forEach((segment, index) => {
    const start = paperX(segment.start_hour);
    const end = paperX(segment.end_hour);
    const y = paperY[normalizePaperStatus(segment.duty_status, segment.remark)];
    dutyPath += index === 0 ? `M ${start} ${y} L ${end} ${y}` : ` L ${start} ${y} L ${end} ${y}`;
  });
  const printText = (text, max = 44) => {
    const value = String(text || '');
    return value.length > max ? `${value.slice(0, max - 3).trimEnd()}...` : value;
  };

  return (
    <div className="paper-log-sheet" aria-hidden="true">
      <svg viewBox="0 0 513 518" role="img" aria-label="Filled FMCSA driver's daily log form">
        <rect width="513" height="518" fill="#fff" />
        <g fill="#000" fontFamily="Arial, Helvetica, sans-serif">
          <text x="21" y="15" fontSize="12" fontWeight="700">Drivers Daily Log</text>
          <text x="84" y="26" fontSize="6">(24 hours)</text>
          <text x="168" y="20" fontSize="5">(month)</text><text x="210" y="20" fontSize="5">(day)</text><text x="249" y="20" fontSize="5">(year)</text>
          <text x="301" y="17" fontSize="5">Original - File at home terminal.</text>
          <text x="301" y="24" fontSize="5">Duplicate - Driver retains in his/her possession for 8 days.</text>
          <text x="22" y="43" fontSize="7" fontWeight="700">From:</text><text x="226" y="43" fontSize="7" fontWeight="700">To:</text>
          <text x="61" y="94" fontSize="5">Total Miles Driving Today</text><text x="142" y="94" fontSize="5">Total Mileage Today</text>
          <text x="292" y="85" fontSize="5">Name of Carrier or Carriers</text><text x="320" y="104" fontSize="5">Main Office Address</text><text x="320" y="123" fontSize="5">Home Terminal Address</text>
          <text x="57" y="127" fontSize="5">Truck/Tractor and Trailer Numbers or</text><text x="78" y="134" fontSize="5">License Plate(s)/State (show each unit)</text>
        </g>
        <g stroke="#000" strokeWidth=".7" fill="none">
          <line x1="171" y1="30" x2="203" y2="30" /><line x1="210" y1="30" x2="242" y2="30" /><line x1="249" y1="30" x2="290" y2="30" />
          <line x1="64" y1="46" x2="241" y2="46" /><line x1="260" y1="46" x2="437" y2="46" />
          <rect x="52" y="66" width="84" height="21" /><rect x="138" y="66" width="80" height="21" /><rect x="52" y="100" width="166" height="20" />
          <line x1="230" y1="80" x2="467" y2="80" /><line x1="230" y1="100" x2="467" y2="100" /><line x1="230" y1="120" x2="467" y2="120" />
        </g>

        <rect x="55" y="153" width="400" height="31" fill="#000" />
        <g fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontSize="5" fontWeight="700" textAnchor="middle">
          <text x="61" y="164">Mid-</text><text x="61" y="170">night</text>
          {Array.from({ length: 24 }).map((_, hour) => {
            const label = hour === 0 ? '1' : hour === 11 ? 'Noon' : hour < 11 ? String(hour + 1) : String(hour - 11);
            return <text key={hour} x={55 + ((hour + .5) / 24) * 400} y="177">{label}</text>;
          })}
          <text x="449" y="164">Mid-</text><text x="449" y="170">night</text>
        </g>
        <g fill="#000" fontFamily="Arial, Helvetica, sans-serif" fontSize="6" fontWeight="700">
          <text x="467" y="163">Total</text><text x="470" y="170">Hours</text>
          <text x="18" y="196">1. Off Duty</text><text x="18" y="213">2. Sleeper</text><text x="18" y="220">Berth</text><text x="18" y="233">3. Driving</text><text x="18" y="249">4. On Duty</text><text x="18" y="256">(not driving)</text>
        </g>
        <g stroke="#000" fill="none">
          <rect x="55" y="184" width="400" height="70" strokeWidth="1" />
          {[1, 2, 3].map((row) => <line key={`row-${row}`} x1="55" y1={184 + row * 17.5} x2="455" y2={184 + row * 17.5} strokeWidth=".55" />)}
          {Array.from({ length: 25 }).map((_, hour) => <line key={`hour-${hour}`} x1={55 + (hour / 24) * 400} y1="184" x2={55 + (hour / 24) * 400} y2="254" strokeWidth={hour % 1 === 0 ? '.45' : '.25'} />)}
          {Array.from({ length: 96 }).map((_, tick) => <line key={`tick-${tick}`} x1={55 + (tick / 96) * 400} y1="184" x2={55 + (tick / 96) * 400} y2={189 + (tick % 4 === 0 ? 4 : 2)} strokeWidth=".25" />)}
          {[194, 211, 228, 245].map((y) => <line key={`track-${y}`} x1="55" y1={y} x2="455" y2={y} strokeWidth=".25" strokeDasharray="1 1" />)}
          {[200, 217, 234, 251].map((y) => <line key={`total-${y}`} x1="467" y1={y} x2="492" y2={y} strokeWidth=".5" />)}
          <line x1="22" y1="285" x2="22" y2="421" strokeWidth="2" /><line x1="22" y1="421" x2="454" y2="421" strokeWidth="2" />
          <line x1="22" y1="353" x2="454" y2="353" strokeWidth=".5" /><line x1="22" y1="382" x2="454" y2="382" strokeWidth=".5" />
          <line x1="22" y1="400" x2="454" y2="400" strokeWidth=".5" />
          <line x1="22" y1="518" x2="459" y2="518" strokeWidth="2" />
        </g>
        <g fill="#000" fontFamily="Arial, Helvetica, sans-serif" fontSize="6" fontWeight="700">
          <text x="22" y="276">Remarks</text><text x="22" y="331">Shipping</text><text x="22" y="338">Documents:</text><text x="22" y="363">DVL or Manifest No.</text><text x="22" y="370">or</text><text x="22" y="391">Shipper &amp; Commodity</text>
          <text x="22" y="434">Recap:</text><text x="22" y="441">Complete at</text><text x="22" y="448">end of day</text><text x="110" y="434">70 Hour/</text><text x="110" y="441">8 Day</text><text x="272" y="434">60 Hour/ 7</text><text x="272" y="441">Day Recap:</text>
        </g>
        <g fill="#000" fontFamily="Arial, Helvetica, sans-serif" fontSize="4.5">
          <text x="130" y="409">Enter name of place you reported and where released from work and when and where each change of duty occurred.</text>
          <text x="192" y="415">Use time standard of home terminal.</text>
          <text x="71" y="461">On duty</text><text x="71" y="468">hours</text><text x="71" y="475">today,</text><text x="71" y="482">total lines</text><text x="71" y="489">3 &amp; 4</text>
          <text x="143" y="461">A. Total</text><text x="143" y="468">hours on</text><text x="143" y="475">duty last 7</text><text x="143" y="482">days</text><text x="143" y="489">including</text><text x="143" y="496">today.</text>
          <text x="191" y="461">B. Total</text><text x="191" y="468">hours</text><text x="191" y="475">available</text><text x="191" y="482">tomorrow</text><text x="191" y="489">to 70 hr.</text><text x="191" y="496">minus A.</text>
          <text x="239" y="461">C. Total</text><text x="239" y="468">hours on</text><text x="239" y="475">duty last 8</text><text x="239" y="482">days</text><text x="239" y="489">including</text><text x="239" y="496">today.</text>
          <text x="319" y="461">A. Total</text><text x="319" y="468">hours on</text><text x="319" y="475">duty last 6</text><text x="319" y="482">days</text><text x="319" y="489">including</text><text x="319" y="496">today.</text>
          <text x="367" y="461">B. Total</text><text x="367" y="468">hours</text><text x="367" y="475">available</text><text x="367" y="482">tomorrow</text><text x="367" y="489">to 60 hr.</text><text x="367" y="496">minus A.</text>
          <text x="415" y="461">C. Total</text><text x="415" y="468">hours on</text><text x="415" y="475">duty last 7</text><text x="415" y="482">days</text><text x="415" y="489">including</text><text x="415" y="496">today.</text>
          <text x="469" y="438" fontWeight="700">*If you took</text><text x="469" y="445" fontWeight="700">34 consecutive</text><text x="469" y="452" fontWeight="700">hours off duty,</text><text x="469" y="459" fontWeight="700">you have 60/70</text><text x="469" y="466" fontWeight="700">hours available.</text>
        </g>

        <g fill="#000" fontFamily="Arial, Helvetica, sans-serif" fontSize="5.4" fontWeight="600">
          <text x="174" y="29">{dateParts[0]}</text><text x="211" y="29">{dateParts[1]}</text><text x="249" y="29">{dateParts[2]}</text>
          <text x="66" y="44">{printText(from, 29)}</text><text x="261" y="44">{printText(to, 29)}</text>
          <text x="94" y="81" textAnchor="middle">{Number(totalMilesToday || 0).toFixed(0)}</text>
          <text x="178" y="81" textAnchor="middle">N/A</text>
          <text x="348" y="77" textAnchor="middle">{printText(logData.carrier_name, 40)}</text>
          <text x="348" y="97" textAnchor="middle">{printText(logData.main_office_address, 40)}</text>
          <text x="348" y="117" textAnchor="middle">{printText(logData.home_terminal_address, 40)}</text>
          <text x="135" y="114" textAnchor="middle">{printText([logData.truck_number || logData.truck_id, logData.trailer_number || logData.trailer_id].filter(Boolean).join(' / '), 28)}</text>
        </g>

        <path d={dutyPath} fill="none" stroke="#000" strokeWidth="1.4" strokeLinecap="square" strokeLinejoin="miter" />
        <g fill="#000" fontFamily="Arial, Helvetica, sans-serif" fontSize="6.2" fontWeight="700" textAnchor="middle">
          <text x="479" y="198">{totalsHours.off_duty.toFixed(1)}</text>
          <text x="479" y="215">{totalsHours.sleeper_berth.toFixed(1)}</text>
          <text x="479" y="232">{totalsHours.driving.toFixed(1)}</text>
          <text x="479" y="249">{totalsHours.on_duty_not_driving.toFixed(1)}</text>
        </g>

        <g fill="#000" fontFamily="Arial, Helvetica, sans-serif" fontSize="4.8">
          {remarks.slice(0, 5).map((remark, index) => (
            <text key={`${remark.time_hour}-${index}`} x="65" y={292 + index * 9.5}>
              {`${Number(remark.time_hour || 0).toFixed(1)}  ${printText(remark.location, 20)} - ${printText(remark.text || remark.remark, 48)}`}
            </text>
          ))}
          <text x="61" y="369">{printText(from, 23)}</text>
          <text x="156" y="369">{printText(to, 23)}</text>
          <text x="80" y="454" textAnchor="middle">{recap.on_duty_today_hours.toFixed(2)}</text>
          <text x="154" y="454" textAnchor="middle">{recap.cycle_hours_cumulative.toFixed(2)}</text>
          <text x="202" y="454" textAnchor="middle">{recap.cycle_hours_remaining.toFixed(2)}</text>
        </g>
      </svg>
    </div>
  );
}

export default function DailyLogSheet({ logData, dayIndex = 0, totalDays = 1 }) {
  if (!logData) return null;

  const width = 960;

  // Grid Coordinate Geometry
  const gridX = 140;
  const gridWidth = 720; // 30px per hour * 24 hours
  const rowHeight = 36;
  const gridHeaderY = 65;
  const gridTopY = 95;
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
    location: seg.location || '',
    miles_driven: Number(seg.miles_driven ?? seg.distance_miles ?? 0)
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

  // Segments are the source of truth for the plotted form.  Older persisted logs
  // may carry an all-zero totals_hours object, so never let that overwrite a real grid.
  const totalsHours = {
    off_duty: Number(computedTotals.off_duty.toFixed(2)),
    sleeper_berth: Number(computedTotals.sleeper_berth.toFixed(2)),
    driving: Number(computedTotals.driving.toFixed(2)),
    on_duty_not_driving: Number(computedTotals.on_duty_not_driving.toFixed(2)),
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
  const reportedMilesToday = Number(logData.total_miles_driving_today ?? logData.miles_driven ?? 0);
  const segmentMilesToday = segments.reduce((total, segment) => total + Number(segment.miles_driven || 0), 0);
  const remarkMilesToday = remarks.reduce((total, remark) => {
    const match = String(remark.text || remark.remark || '').match(/driving\s*\(([\d.]+)\s*mi\)/i);
    return total + (match ? Number(match[1]) : 0);
  }, 0);
  const totalMilesToday = reportedMilesToday > 0 ? reportedMilesToday : (segmentMilesToday || remarkMilesToday || 0);
  const mainOffice = logData.main_office_address || "100 Logistics Blvd, Suite 400, Chicago, IL";
  const homeTerminal = logData.home_terminal_address || "770 Freight Way, Chicago, IL";

  const onDutyToday = Number((totalsHours.driving + totalsHours.on_duty_not_driving).toFixed(2));
  const cycleAtStart = Number(logData.recap?.cycle_hours_at_start ?? 24.5);
  const cycleCumulative = Number((cycleAtStart + onDutyToday).toFixed(2));
  const recap = {
    on_duty_today_hours: onDutyToday,
    cycle_hours_at_start: cycleAtStart,
    cycle_hours_cumulative: cycleCumulative,
    cycle_hours_remaining: Math.max(0, Number((70 - cycleCumulative).toFixed(2)))
  };

  const remarksHeaderY = gridBottomY + 26;
  const remarksStartY = gridBottomY + 51;
  const remarkRowHeight = 30;
  const recapY = Math.max(424, remarksStartY + remarks.length * remarkRowHeight + 18);
  const height = recapY + 140;
  const truncateRemark = (remark) => {
    const text = String(remark.text || remark.remark || 'Duty Status Change')
      .replace(/\s*\([^()]*\)\s*$/, '')
      .trim();
    const label = remark.location && !text.includes(remark.location) ? `${text} · ${remark.location}` : text;
    return label.length > 39 ? `${label.slice(0, 38).trimEnd()}…` : label;
  };

  return (
    <>
      <div className="digital-log-sheet">
        <div className="digital-log-fields" aria-label="Log sheet details">
          <div className="field-date"><span>Date</span><b>{dateStr}</b></div>
          <div className="field-driver"><span>Driver</span><b>{driverName}</b></div>
          <div className="field-carrier"><span>Carrier</span><b>{carrierName}</b></div>
          <div className="field-vehicle"><span>Vehicle</span><b>{truckNumber} · {trailerNumber}</b></div>
          <div className="field-miles"><span>Driving miles</span><b>{Number(totalMilesToday).toFixed(0)} mi</b></div>
          <div className="field-office"><span>Main office</span><b>{mainOffice}</b></div>
          <div className="field-terminal"><span>Home terminal</span><b>{homeTerminal}</b></div>
        </div>
        <div className="svg-log-wrapper">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block', fontFamily: 'Inter, Arial, sans-serif' }}
      >
        {/* Paper Background */}
        <rect x="0" y="0" width={width} height={height} fill="#ffffff" />

        {/* Screen-only identifier. Driver and trip metadata live in the field strip above. */}
        <text x="30" y="36" fontSize="17" fontWeight="700" fill="#0f172a">
          Daily duty status - Day {logData.day_number || dayIndex + 1} of {totalDays || 1}
        </text>

        {/* 2. Graph Grid Header (Hour Numbers) */}
        <rect x={gridX} y={gridHeaderY} width={gridWidth} height="24" fill="#0f172a" rx="4" />
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
              y={gridHeaderY + 16}
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
        <text x="895" y={gridHeaderY + 16} fontSize="11" fontWeight="700" fill="#0f172a" textAnchor="middle">
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
        <g transform={`translate(870, ${gridBottomY + 6})`}>
          <rect width="50" height="22" fill="#dcfce7" rx="11" stroke="#86efac" />
          <text x="25" y="15" fontSize="11" fontWeight="800" fill="#166534" textAnchor="middle">
            {Number((totalsHours.off_duty + totalsHours.sleeper_berth + totalsHours.driving + totalsHours.on_duty_not_driving).toFixed(1))} h
          </text>
        </g>

        {/* 5. Remarks Section */}
        <text x="30" y={remarksHeaderY} fontSize="14" fontWeight="700" fill="#0f172a">
          Remarks & Location of Duty Changes:
        </text>

        {/* Remarks Drop Lines & Badges */}
        {remarks.map((rem, remIdx) => {
          const timeH = rem.time_hour !== undefined ? Number(rem.time_hour) : (rem.time_min !== undefined ? rem.time_min / 60 : 0);
          const rx = hourToX(timeH);
          const remY = remarksStartY + remIdx * remarkRowHeight;
          const badgeWidth = 232;
          const badgeX = Math.max(10, Math.min(rx - 80, width - badgeWidth - 10));

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
                x={badgeX}
                y={remY - 14}
                width={badgeWidth}
                height="22"
                fill="#f8fafc"
                rx="6"
                stroke="#cbd5e1"
              />
              <text
                x={badgeX + 6}
                y={remY + 1}
                fontSize="10.5"
                fontWeight="600"
                fill="#1e293b"
              >
                <tspan fill="#2563eb" fontWeight="700">{timeH.toFixed(1)}h:</tspan> {truncateRemark(rem)}
              </text>
            </g>
          );
        })}

        {/* 6. Recap Table (Bottom) */}
        <g transform={`translate(30, ${recapY})`}>
          <rect width="900" height="118" fill="#f8fafc" rx="8" stroke="#cbd5e1" />
          <text x="18" y="24" fontSize="12" fontWeight="700" fill="#0f172a">
            70-Hour / 8-Day Driver Recap:
          </text>

          {/* Table Columns */}
          <g fontSize="11" fill="#475569">
            {/* Col 1: On-Duty Today */}
            <rect x="18" y="36" width="180" height="68" fill="#ffffff" rx="6" stroke="#e2e8f0" />
            <text x="30" y="54" fontWeight="600">On-Duty Hours Today</text>
            <text x="30" y="76" fontSize="15" fontWeight="800" fill="#0f172a">
              {recap.on_duty_today_hours} hrs
            </text>
            <text x="30" y="93" fontSize="10" fill="#94a3b8">Lines 3 &amp; 4</text>

            {/* Col 2: Cycle at Start */}
            <rect x="210" y="36" width="180" height="68" fill="#ffffff" rx="6" stroke="#e2e8f0" />
            <text x="222" y="54" fontWeight="600">Cycle at Start of Day</text>
            <text x="222" y="76" fontSize="15" fontWeight="800" fill="#2563eb">
              {recap.cycle_hours_at_start} hrs
            </text>
            <text x="222" y="93" fontSize="10" fill="#94a3b8">Input / prior day</text>

            {/* Col 3: Cumulative Cycle */}
            <rect x="402" y="36" width="220" height="68" fill="#ffffff" rx="6" stroke="#e2e8f0" />
            <text x="414" y="54" fontWeight="600">Cumulative Cycle Used</text>
            <text x="414" y="76" fontSize="15" fontWeight="800" fill="#0f172a">
              {recap.cycle_hours_cumulative} / 70.0 h
            </text>
            <text x="414" y="93" fontSize="10" fill="#94a3b8">70-hour / 8-day limit</text>

            {/* Col 4: Hours Available Tomorrow */}
            <rect x="634" y="36" width="250" height="68" fill="#ffffff" rx="6" stroke="#e2e8f0" />
            <text x="646" y="54" fontWeight="600">Hours Available Tomorrow</text>
            <text x="646" y="76" fontSize="15" fontWeight="800" fill="#16a34a">
              {recap.cycle_hours_remaining} hrs
            </text>
            <text x="646" y="93" fontSize="10" fill="#94a3b8">70.0 minus cumulative</text>
          </g>
        </g>
      </svg>
        </div>
      </div>
      <PrintablePaperLog logData={logData} segments={segments} totalsHours={totalsHours} recap={recap} totalMilesToday={totalMilesToday} />
    </>
  );
}
