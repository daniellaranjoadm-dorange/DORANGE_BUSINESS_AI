import type {
  Appointment,
  FinancialTransaction,
  InventoryItem,
} from "../types";
export function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
const cents = (value: number) =>
  Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : 0;
const total = (values: number[]) =>
  values.reduce((sum, v) => sum + cents(v), 0) / 100;
export function businessInsights(
  tenantId: string,
  appointments: Appointment[],
  transactions: FinancialTransaction[],
  inventory: InventoryItem[],
  now = new Date(),
) {
  const today = localDateKey(now),
    month = today.slice(0, 7);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowKey = localDateKey(tomorrow);
  const apps = appointments.filter((a) => a.tenantId === tenantId);
  const tx = transactions.filter((t) => t.tenantId === tenantId);
  const active = (a: Appointment) =>
    a.status === "pending" || a.status === "confirmed";
  const todayAppointments = apps
    .filter(
      (a) =>
        a.date === today && a.status !== "cancelled" && a.status !== "no_show",
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  const confirmations = apps
    .filter(
      (a) => a.status === "pending" && a.date >= today && a.date <= tomorrowKey,
    )
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const unresolved = apps.filter((a) => active(a) && a.date < today);
  const receivables = tx.filter(
    (t) =>
      t.type === "income" &&
      t.status === "pending" &&
      (t.dueDate || t.date) <= today,
  );
  const monthPaid = tx.filter(
    (t) => t.status === "paid" && t.date.slice(0, 7) === month,
  );
  const revenue = total(
    monthPaid.filter((t) => t.type === "income").map((t) => t.amount),
  );
  const expenses = total(
    monthPaid
      .filter((t) => t.type === "expense" || t.type === "commission")
      .map((t) => t.amount),
  );
  const completed = apps.filter(
    (a) => a.status === "completed" && a.date.slice(0, 7) === month,
  );
  const futureUnpaid = total(
    apps
      .filter((a) => active(a) && a.date >= today && a.paymentStatus !== "paid")
      .map((a) => {
        const recorded = total(
          tx
            .filter(
              (t) =>
                t.appointmentId === a.id &&
                t.type === "income" &&
                t.status === "paid",
            )
            .map((t) => t.amount),
        );
        const deposit =
          a.paymentStatus === "deposit_paid" ? a.depositAmount || 0 : 0;
        return Math.max(
          0,
          (cents(a.price) - Math.max(cents(recorded), cents(deposit))) / 100,
        );
      }),
  );
  return {
    today,
    month,
    todayAppointments,
    confirmations,
    unresolved,
    receivables,
    receivableAmount: total(receivables.map((t) => t.amount)),
    revenue,
    expenses,
    net: Math.round((revenue - expenses) * 100) / 100,
    completedCount: completed.length,
    averageTicket: completed.length
      ? total(completed.map((a) => a.price)) / completed.length
      : 0,
    futureUnpaid,
    lowStock: inventory.filter(
      (i) => i.tenantId === tenantId && i.quantity <= i.minQuantity,
    ),
    cancelled: apps.filter(
      (a) => a.status === "cancelled" && a.date.slice(0, 7) === month,
    ).length,
  };
}
