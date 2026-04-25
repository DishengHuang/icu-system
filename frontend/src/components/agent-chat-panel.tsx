"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  streamAgentChatMessage,
  type AgentChatHistoryMessage,
} from "@/services/api";
import type { PatientDetail } from "@/types";

type AgentChatPanelProps = {
  patient: PatientDetail;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const STARTER_PROMPTS = [
  "Summarize this patient",
  "What are the main risks right now?",
  "List the key medications",
];

export function AgentChatPanel({ patient }: AgentChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const initialMessage = useMemo<ChatMessage>(
    () => ({
      id: "welcome",
      role: "assistant",
      text: `Ask about ${patient.full_name}'s current status, risks, or medications.`,
    }),
    [patient.full_name]
  );
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function submitMessage(messageText: string) {
    const trimmed = messageText.trim();
    if (!trimmed || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      text: "",
    };
    const history: AgentChatHistoryMessage[] = messages
      .filter((message) => message.id !== "welcome" && message.text.trim().length > 0)
      .map((message) => ({
        role: message.role,
        text: message.text,
      }));

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput("");
    setError(null);
    setIsSending(true);
    setStreamingMessageId(assistantMessageId);

    try {
      await streamAgentChatMessage(
        {
          patientId: patient.id,
          message: trimmed,
          history,
          context: {
            page: "patient_detail",
            patientName: patient.full_name,
            clinicalStatus: patient.clinical_status,
            primaryDiagnosis: patient.primary_diagnosis,
          },
        },
        {
          onDelta: (chunk) => {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessageId
                  ? { ...message, text: `${message.text}${chunk}` }
                  : message
              )
            );
          },
        }
      );
    } catch (error) {
      setMessages((current) =>
        current.filter(
          (message) =>
            message.id !== assistantMessageId || message.text.trim().length > 0
        )
      );
      setError(error instanceof Error ? error.message : "Unable to reach the agent right now.");
    } finally {
      setIsSending(false);
      setStreamingMessageId(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitMessage(input);
  }

  return (
    <section className="agent-chat-card card" aria-label="Patient assistant">
      <div className="agent-chat-header">
        <div>
          <h2 className="agent-chat-title">Clinical Assistant</h2>
          <p className="agent-chat-subtitle muted">
            Patient-aware chat for quick summaries and decision support.
          </p>
        </div>
      </div>

      <div className="agent-chat-prompts">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="agent-chat-prompt"
            onClick={() => void submitMessage(prompt)}
            disabled={isSending}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="agent-chat-messages" aria-live="polite">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "agent-chat-message agent-chat-message--user"
                : "agent-chat-message agent-chat-message--assistant"
            }
          >
            <div className="agent-chat-message-role">
              {message.role === "user" ? "You" : "Agent"}
            </div>
            <p className="agent-chat-message-text">
              {message.text ||
                (message.id === streamingMessageId && isSending ? "Thinking..." : "")}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error ? <p className="agent-chat-error">{error}</p> : null}

      <form className="agent-chat-form" onSubmit={handleSubmit}>
        <textarea
          className="agent-chat-input"
          rows={4}
          placeholder="Ask about patient summary, risks, medications, or latest note..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isSending}
        />
        <button
          type="submit"
          className="agent-chat-submit dashboard-search-btn"
          disabled={isSending || input.trim().length === 0}
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}
