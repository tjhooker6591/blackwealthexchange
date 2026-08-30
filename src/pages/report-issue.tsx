import SupportTicketEntryPage from "@/components/support/SupportTicketEntryPage";

export default function Page() {
  return (
    <SupportTicketEntryPage
      title="Report an Issue"
      intro="Use this route to report a technical issue, broken page, account problem, or other support concern that needs follow-up."
      metaTitle="Report an Issue | Black Wealth Exchange"
      metaDescription="Report a technical issue, broken page, account problem, or other support concern to Black Wealth Exchange."
      canonicalPath="/report-issue"
      defaultCategory="Technical Issue"
    />
  );
}
