import ConversationInterface from "@/modules/chat/components/ConversationInterface";

interface ConversationPageProps {
  params: {
    conversationId: string;
  };
}

export default function ConversationPage({ params }: ConversationPageProps) {
  return <ConversationInterface conversationId={params.conversationId} />;
}
