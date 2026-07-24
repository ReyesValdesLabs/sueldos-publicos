#!/usr/bin/env python3
"""Extract the RBD, zone and rural fields from Mineduc's XLSX using stdlib only."""

import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile


MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"


def qname(local_name):
    return f"{{{MAIN_NS}}}{local_name}"


def column_index(reference):
    match = re.match(r"([A-Z]+)", reference or "")
    if not match:
        raise ValueError(f"Celda sin referencia válida: {reference!r}")
    value = 0
    for character in match.group(1):
        value = value * 26 + ord(character) - ord("A") + 1
    return value - 1


def shared_strings(workbook):
    path = "xl/sharedStrings.xml"
    if path not in workbook.namelist():
        return []

    values = []
    with workbook.open(path) as source:
        for _, element in ET.iterparse(source, events=("end",)):
            if element.tag == qname("si"):
                values.append("".join(node.text or "" for node in element.iter(qname("t"))))
                element.clear()
    return values


def cell_value(cell, strings):
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        return "".join(node.text or "" for node in cell.iter(qname("t")))

    value_node = cell.find(qname("v"))
    if value_node is None or value_node.text is None:
        return None
    if cell_type == "s":
        return strings[int(value_node.text)]
    if cell_type == "b":
        return value_node.text == "1"
    return value_node.text


def number(value):
    if value is None or value == "":
        return None
    numeric = float(str(value).replace(",", "."))
    return int(numeric) if numeric.is_integer() else numeric


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Uso: extract-school-zones.py <archivo.xlsx>")

    with zipfile.ZipFile(sys.argv[1]) as workbook:
        strings = shared_strings(workbook)
        worksheets = sorted(
            name for name in workbook.namelist()
            if re.fullmatch(r"xl/worksheets/sheet\d+\.xml", name)
        )
        if not worksheets:
            raise ValueError("El archivo XLSX no contiene hojas de cálculo.")

        headers = None
        indexes = None
        source_rows = 0
        schools = {}

        with workbook.open(worksheets[0]) as source:
            for _, row in ET.iterparse(source, events=("end",)):
                if row.tag != qname("row"):
                    continue

                values = {}
                for cell in row.findall(qname("c")):
                    values[column_index(cell.attrib.get("r"))] = cell_value(cell, strings)

                if headers is None:
                    headers = {
                        str(value).strip().upper(): index
                        for index, value in values.items()
                        if value is not None
                    }
                    required = {"AGNO", "RBD", "NOMBRERBD", "RURAL_RBD", "MES", "PORC_ZONA"}
                    missing = required.difference(headers)
                    if missing:
                        raise ValueError(f"Faltan columnas requeridas: {', '.join(sorted(missing))}")
                    indexes = {name: headers[name] for name in required}
                else:
                    year = number(values.get(indexes["AGNO"]))
                    rbd = number(values.get(indexes["RBD"]))
                    if year == 2025 and isinstance(rbd, int) and rbd > 0:
                        source_rows += 1
                        school = schools.setdefault(rbd, {
                            "rbd": rbd,
                            "name": str(values.get(indexes["NOMBRERBD"]) or "").strip(),
                            "zoneValues": set(),
                            "ruralValues": set(),
                            "monthsObserved": set(),
                        })
                        zone = number(values.get(indexes["PORC_ZONA"]))
                        rural = number(values.get(indexes["RURAL_RBD"]))
                        month = number(values.get(indexes["MES"]))
                        if zone is not None:
                            school["zoneValues"].add(zone)
                        if rural is not None:
                            school["ruralValues"].add(rural)
                        if month is not None:
                            school["monthsObserved"].add(month)

                row.clear()

    output = {
        "totalRows": source_rows,
        "schools": [
            {
                **school,
                "zoneValues": sorted(school["zoneValues"]),
                "ruralValues": sorted(school["ruralValues"]),
                "monthsObserved": sorted(school["monthsObserved"]),
            }
            for school in sorted(schools.values(), key=lambda item: item["rbd"])
        ],
    }
    json.dump(output, sys.stdout, ensure_ascii=False, separators=(",", ":"))


if __name__ == "__main__":
    main()
