"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [instruction, setInstruction] = useState("");
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [emails, setEmails] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);

  const spinner = <span className={styles.spinner} />;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setTranscript(text);
  }

  async function generateSummary() {
    setLoadingSummary(true);
    setSummary("");
    try {
      const resp = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, instruction }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed");
      setSummary(data.summary || "");
    } catch (err: any) {
      alert(err?.message || "Error generating summary");
    } finally {
      setLoadingSummary(false);
    }
  }

  async function sendEmail() {
    setLoadingEmail(true);
    try {
      const recipients = emails
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      if (!recipients.length || !summary) {
        alert("Recipients and summary are required!");
        return;
      }

      const resp = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          subject: "Meeting Summary",
          body: summary,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed to send");

      alert("✅ Email sent!");
    } catch (err: any) {
      alert(err?.message || "Error sending email");
    } finally {
      setLoadingEmail(false);
    }
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.heading}>AI Meeting Notes Summarizer</h1>

      <section className={styles.section}>
        <label className={styles.label}>Upload transcript (.txt): </label>
        <input type="file" accept=".txt,text/plain" onChange={handleFile} className={styles.input} />
      </section>

      <section className={styles.section}>
        <label className={styles.label}>Or paste transcript:</label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste transcript here..."
          className={styles.textarea}
        />
      </section>

      <section className={styles.section}>
        <label className={styles.label}>Custom instruction/prompt:</label>
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder='e.g., "Summarize in bullet points for executives"'
          className={styles.input}
        />
      </section>

      <button
        className={styles.button}
        onClick={generateSummary}
        disabled={loadingSummary || !transcript}
      >
        {loadingSummary && spinner}
        {loadingSummary ? "Generating..." : "Generate Summary"}
      </button>

      <section className={styles.section}>
        <label className={styles.label}>Editable Summary:</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Summary will appear here..."
          className={styles.textarea}
        />
      </section>

      <section className={styles.section}>
        <label className={styles.label}>Share via email (comma-separated):</label>
        <input
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          placeholder="a@x.com, b@y.com"
          className={styles.input}
        />
      </section>

      <button
        className={styles.button}
        onClick={sendEmail}
        disabled={!summary || !emails.trim() || loadingEmail}
      >
        {loadingEmail && spinner}
        {loadingEmail ? "Sending..." : "Send Email"}
      </button>
    </main>
  );
}


