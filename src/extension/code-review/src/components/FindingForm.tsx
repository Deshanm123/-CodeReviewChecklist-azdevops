import { useState, type FormEvent } from "react";
import { SEVERITIES, type Severity } from "../../../../shared/review-findings";

interface FindingFormProps {
  disabled: boolean;
  onSubmit(input: { task: string; severity: Severity; description?: string }): Promise<boolean>;
}

export function FindingForm({ disabled, onSubmit }: FindingFormProps) {
  const [task, setTask] = useState("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [description, setDescription] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!task.trim() || !severity) {
      setValidationMessage("Enter a finding and select its severity.");
      return;
    }

    setValidationMessage("");
    const created = await onSubmit({
      task: task.trim(),
      severity,
      ...(description.trim() ? { description: description.trim() } : {}),
    });
    if (!created) return;
    setTask("");
    setSeverity("");
    setDescription("");
  }

  return (
    <form className="finding-form" onSubmit={handleSubmit} noValidate>
      <h2>Add finding</h2>
      <div className="form-grid">
        <label>
          Finding <span aria-hidden="true">*</span>
          <input
            value={task}
            onChange={(event) => setTask(event.target.value)}
            maxLength={500}
            required
            disabled={disabled}
          />
        </label>
        <label>
          Severity <span aria-hidden="true">*</span>
          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value as Severity | "")}
            required
            disabled={disabled}
          >
            <option value="">Select severity</option>
            {[...SEVERITIES].reverse().map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Description <span className="optional">(optional)</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={4000}
          rows={3}
          disabled={disabled}
        />
      </label>
      {validationMessage ? (
        <p className="validation" role="alert">
          {validationMessage}
        </p>
      ) : null}
      <button type="submit" disabled={disabled}>
        {disabled ? "Adding…" : "Add finding"}
      </button>
    </form>
  );
}
