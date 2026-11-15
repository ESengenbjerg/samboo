import FormError from "@/components/form-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useOpenIssues } from "@/hooks/admin/useOpenIssues";
import { OpenIssue } from "@/types/admin";
import { formatDateTime } from "@/utils/date-format";
import { View } from "react-native";

function IssueCard({ issue }: { issue: OpenIssue }) {
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="px-4">
        <CardTitle>{issue.agency}</CardTitle>
      </CardHeader>
      <CardContent className="gap-2 px-4">
        <Text>{issue.description}</Text>
        <Text variant="muted">Sedan {formatDateTime(issue.first_seen_at)}</Text>
      </CardContent>
    </Card>
  );
}

// Read-only list of open scrape issues. No buttons: an issue closes itself on the next clean run, otherwise the admin contacts the developer
export default function OpenIssuesSection() {
  const { issues, isLoading, error } = useOpenIssues();

  return (
    <View className="gap-4">
      <Text variant="h2">Öppna ärenden</Text>
      <Text variant="muted">
        Ärenden stängs av sig själva när nästa hämtning går bra. Kontakta
        IT-supporten om ett ärende ligger kvar.
      </Text>

      {isLoading && <Spinner />}
      {error && <FormError>{error}</FormError>}
      {!isLoading && !error && issues.length === 0 && (
        <Text>Inga öppna ärenden.</Text>
      )}

      {issues.map((i) => (
        <IssueCard key={i.id} issue={i} />
      ))}
    </View>
  );
}
