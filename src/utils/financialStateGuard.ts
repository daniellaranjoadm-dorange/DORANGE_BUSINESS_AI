export type FinancialIdentity = {
  id: string;
  tenantId: string;
};

export class FinancialStateGuard {
  private tenantId: string | null = null;
  private generation = 0;
  private mutationVersion = 0;
  private readVersion = 0;

  selectTenant(tenantId: string | null): void {
    if (this.tenantId === tenantId) return;
    this.tenantId = tenantId;
    this.generation++;
    this.mutationVersion++;
  }

  currentTenant(): string | null {
    return this.tenantId;
  }

  beginRead(tenantId: string): {
    tenantId: string;
    generation: number;
    readVersion: number;
    mutationVersion: number;
  } {
    return {
      tenantId,
      generation: this.generation,
      readVersion: ++this.readVersion,
      mutationVersion: this.mutationVersion,
    };
  }

  acceptRead(ticket: ReturnType<FinancialStateGuard["beginRead"]>): boolean {
    return (
      this.tenantId === ticket.tenantId &&
      this.generation === ticket.generation &&
      this.readVersion === ticket.readVersion &&
      this.mutationVersion === ticket.mutationVersion
    );
  }

  acceptMutation(tenantId: string): boolean {
    if (this.tenantId !== tenantId) return false;
    this.mutationVersion++;
    return true;
  }
}

export function mergeFinancialTransaction<T extends FinancialIdentity>(
  previous: T[],
  transaction: T
): T[] {
  const existing = previous.findIndex(
    (item) => item.id === transaction.id
  );

  if (existing < 0) return [transaction, ...previous];

  return previous.map((item, index) =>
    index === existing ? transaction : item
  );
}