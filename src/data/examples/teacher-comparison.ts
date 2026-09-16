import { calculateTeacherSalary } from "@/lib/calculation/calculate";
import type { CalculationResult } from "@/lib/calculation/types";
import { createTeacherExampleInput, teacherExampleResult } from "./teacher";

// Change only the recognized biennia; preserve every other assumption of the case.
export const teacherTwoBienniaResult = calculateTeacherSalary({ ...createTeacherExampleInput(), biennia: 2 });
export function teacherEarning(result: CalculationResult, id: string) {
  const line = result.earnings.find((item) => item.id === id);
  if (!line) throw new Error(`Missing earning in teacher example: ${id}`);
  return line.amount;
}

export const teacherComparisonRows = [
  { label: "RBMN / sueldo base", select: (r: CalculationResult) => r.legalRbmn },
  { label: "Asignación de experiencia", select: (r: CalculationResult) => teacherEarning(r, "experience") },
  { label: "Tramo · experiencia", select: (r: CalculationResult) => teacherEarning(r, "tranche-experience") },
  { label: "Tramo · progresión", select: (r: CalculationResult) => teacherEarning(r, "tranche-progression") },
  { label: "Total haberes", select: (r: CalculationResult) => r.totalEarnings },
  { label: "Total descuentos", select: (r: CalculationResult) => r.totalDiscounts },
  { label: "Sueldo líquido", select: (r: CalculationResult) => r.netSalary },
].map(({ label, select }) => ({ label, two: select(teacherTwoBienniaResult), three: select(teacherExampleResult) }));
