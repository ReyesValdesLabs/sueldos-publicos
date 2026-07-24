export function normalizeSchoolZoneRows(rows, publicRbds) {
  const rowsByRbd = new Map(rows.map((row) => [row.rbd, row]));

  return [...publicRbds]
    .map((rbd) => {
      const row = rowsByRbd.get(rbd);
      if (!row) {
        return {
          rbd,
          zonePercentage: null,
          rural: null,
          monthsObserved: [],
          consistent: false,
        };
      }

      const zoneIsConsistent = row.zoneValues.length === 1;
      const ruralIsConsistent = row.ruralValues.length === 1 && [0, 1].includes(row.ruralValues[0]);
      const monthsObserved = [...new Set(row.monthsObserved)].sort((left, right) => left - right);

      return {
        rbd: row.rbd,
        zonePercentage: zoneIsConsistent ? row.zoneValues[0] : null,
        rural: ruralIsConsistent ? row.ruralValues[0] === 1 : null,
        monthsObserved,
        consistent: zoneIsConsistent && ruralIsConsistent,
      };
    })
    .sort((left, right) => left.rbd - right.rbd);
}
