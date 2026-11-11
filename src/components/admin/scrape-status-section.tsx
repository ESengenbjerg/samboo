import FormError from "@/components/form-error";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useScrapeStatus } from "@/hooks/admin/useScrapeStatus";
import { AgencyStatus, ScrapeRunOutcome } from "@/types/admin";
import { formatDateTime } from "@/utils/date-format";
import { View } from "react-native";

// Swedish label and badge color per outcome of the latest run
const OUTCOME_BADGE: Record<
  ScrapeRunOutcome,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  ok: { label: "OK", variant: "default" },
  skipped: { label: "Inget att hämta", variant: "secondary" },
  failed: { label: "Misslyckades", variant: "destructive" },
  suspicious: { label: "Misstänkt resultat", variant: "destructive" },
  error: { label: "Fel", variant: "destructive" },
};

function OutcomeBadge({ outcome }: { outcome: ScrapeRunOutcome | null }) {
  if (!outcome) {
    return (
      <Badge variant="outline">
        <Text>Ingen körning</Text>
      </Badge>
    );
  }
  const { label, variant } = OUTCOME_BADGE[outcome];
  return (
    <Badge variant={variant}>
      <Text>{label}</Text>
    </Badge>
  );
}

// One label and value on a line in an agency card
function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4">
      <Text variant="muted">{label}</Text>
      <Text variant="small">{value}</Text>
    </View>
  );
}

function AgencyCard({ agency }: { agency: AgencyStatus }) {
  return (
    <Card className="gap-4 py-4">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4">
        <CardTitle>{agency.agency}</CardTitle>
        <OutcomeBadge outcome={agency.last_outcome} />
      </CardHeader>
      <CardContent className="gap-2 px-4">
        <StatusRow
          label="Senaste körning"
          value={formatDateTime(agency.last_run_at)}
        />
        <StatusRow
          label="Senast lyckad"
          value={formatDateTime(agency.last_ok_at)}
        />
        <StatusRow
          label="Aktiva objekt"
          value={String(agency.active_listings)}
        />
        <StatusRow
          label="Objekt senast sett"
          value={formatDateTime(agency.last_seen_at)}
        />
        <StatusRow label="Öppna ärenden" value={String(agency.open_issues)} />
      </CardContent>
    </Card>
  );
}

// Per agency: when the scraper last ran, whether it went well, active listings and open issues
export default function ScrapeStatusSection() {
  const { agencies, isLoading, error } = useScrapeStatus();

  return (
    <View className="gap-4">
      <Text variant="h2">Byråstatus</Text>

      {isLoading && <Spinner />}
      {error && <FormError>{error}</FormError>}
      {!isLoading && !error && agencies.length === 0 && (
        <Text>Inga byråer har hämtats än.</Text>
      )}

      {agencies.map((a) => (
        <AgencyCard key={a.agency} agency={a} />
      ))}
    </View>
  );
}
