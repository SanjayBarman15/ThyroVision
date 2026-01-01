import { Card } from "@/components/ui/card";

interface PatientInfoCardProps {
  patient: {
    name: string;
    age: number;
    gender: string;
    scanDate: string;
  };
}

export default function PatientInfoCard({ patient }: PatientInfoCardProps) {
  return (
    <Card className="border-border bg-card p-4 shadow-sm">
      <h3 className="mb-3 font-semibold text-foreground text-sm uppercase tracking-wider opacity-70">
        Patient Summary
      </h3>
      <div className="grid grid-cols-2 gap-y-3 gap-x-4">
        <div className="col-span-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
            Name
          </p>
          <p className="font-medium text-foreground text-lg">{patient.name}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
            Age
          </p>
          <p className="font-medium text-foreground">{patient.age}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
            Gender
          </p>
          <p className="font-medium text-foreground">{patient.gender}</p>
        </div>
        <div className="col-span-2 border-t border-border pt-2 mt-1">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
            Scan Date
          </p>
          <p className="font-medium text-foreground text-sm">
            {patient.scanDate}
          </p>
        </div>
      </div>
    </Card>
  );
}
