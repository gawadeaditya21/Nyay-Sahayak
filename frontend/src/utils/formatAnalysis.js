function formatLabel(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPrimitive(value) {
  if (value == null || value === "") {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function formatValue(value, depth = 0) {
  if (value == null || value === "") {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return `${"  ".repeat(depth)}${formatPrimitive(value)}`;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          return `${"  ".repeat(depth)}- ${flattenObject(item)}`;
        }

        return `${"  ".repeat(depth)}- ${formatPrimitive(item)}`;
      })
      .join("\n");
  }

  return Object.entries(value)
    .map(([key, nestedValue]) => {
      const formattedNested = formatValue(nestedValue, depth + 1);
      if (!formattedNested) {
        return "";
      }

      if (Array.isArray(nestedValue) || (nestedValue && typeof nestedValue === "object")) {
        return `${"  ".repeat(depth)}${formatLabel(key)}\n${formattedNested}`;
      }

      return `${"  ".repeat(depth)}${formatLabel(key)}: ${formattedNested.trim()}`;
    })
    .filter(Boolean)
    .join("\n");
}

function flattenObject(objectValue) {
  return Object.entries(objectValue)
    .map(([key, value]) => {
      const primitive = formatPrimitive(value);
      return primitive ? `${formatLabel(key)}: ${primitive}` : "";
    })
    .filter(Boolean)
    .join(", ");
}

function getRiskEmoji(severity) {
  switch (severity?.toUpperCase()) {
    case "HIGH":
      return "[HIGH]";
    case "MEDIUM":
      return "[MEDIUM]";
    case "LOW":
      return "[LOW]";
    default:
      return "[RISK]";
  }
}

function isUrgencyLikeLegacyRisk(risk) {
  const combined = `${risk?.clause || ""} ${risk?.reason || ""}`.toLowerCase();
  return /(urgency|urgent|immediate|act quickly|act now|limited time|short deadline|within\s*24|24h|24 hours|deadline pressure|time pressure)/i.test(
    combined
  );
}

export function formatAnalysisResponse(response) {
  if (!response || !response.success) {
    return "Analysis failed. Please try again.";
  }

  const { data } = response;
  const { document, privacy, analysis } = data;
  const query = analysis?.query;
  const structured = analysis?.structured;
  let message = "";

  if (document) {
    message += "Document Information\n";
    message += `File: ${document.fileName}\n`;
    message += `Type: ${analysis?.documentType || document.fileType}\n`;
    message += `Pages: ${document.pages}\n`;
    message += `Extracted characters: ${document.textLength}\n\n`;
  }

  if (privacy) {
    message += "Privacy Protection\n";
    message += privacy.protected
      ? `Protected ${privacy.fieldsProtected} sensitive field(s)\n\n`
      : "No sensitive data detected\n\n";
  }

  if (query) {
    return formatValue(query).trim();
  }

  if (structured) {
    const decision = structured.final_decision || "REVIEW_CAUTION";
    const riskLevel = structured.risk_level || "MEDIUM";
    const keyWarning = Array.isArray(structured.warnings) && structured.warnings.length > 0
      ? structured.warnings[0]
      : "Review the document carefully.";

    message += "Decision Summary\n";
    message += `Decision: ${decision}\n`;
    message += `Classification: ${structured.classification || "UNFAIR"}\n`;
    message += `Risk Level: ${riskLevel}\n`;
    if (structured.confidence_score) {
      message += `Confidence Score: ${structured.confidence_score}\n`;
    }
    if (structured.escalation) {
      message += `Escalation: ${structured.escalation}\n`;
    }
    message += `Key Warning: ${keyWarning}\n\n`;

    if (structured.smart_difference_explanation) {
      message += "Smart Explanation\n";
      message += `${structured.smart_difference_explanation}\n\n`;
    }

    if (Array.isArray(structured.what_user_should_do) && structured.what_user_should_do.length > 0) {
      message += "What User Should Do\n";
      structured.what_user_should_do.forEach((action) => {
        message += `- ${action}\n`;
      });
      message += "\n";
    }

    if (Array.isArray(structured.law_reference?.laws) && structured.law_reference.laws.length > 0) {
      message += "Law Reference\n";
      structured.law_reference.laws.forEach((law) => {
        message += `- ${law}\n`;
      });
      if (structured.law_reference.simple_explanation) {
        message += `${structured.law_reference.simple_explanation}\n`;
      }
      message += "\n";
    }

    if (Array.isArray(structured.quantified_impact) && structured.quantified_impact.length > 0) {
      message += "Quantified Impact\n";
      structured.quantified_impact.forEach((impact) => {
        message += `- ${impact}\n`;
      });
      message += "\n";
    }

    if (Array.isArray(structured.legal_validity_flags) && structured.legal_validity_flags.length > 0) {
      message += "Legal Validity Flags\n";
      structured.legal_validity_flags.forEach((flag) => {
        const parts = [flag.type, flag.clause, flag.law, flag.explanation]
          .filter(Boolean)
          .join(" | ");
        message += `- ${parts}\n`;
      });
      message += "\n";
    }

    if (Array.isArray(structured.top_risks) && structured.top_risks.length > 0) {
      message += "Top Risks\n";
      structured.top_risks.forEach((risk) => {
        message += `- Type: ${risk.type || "General Risk"}, Description: ${risk.description || ""}, Impact: ${risk.impact || ""}\n`;
      });
      message += "\n";
    }

    if (Array.isArray(structured.suspicious_clauses) && structured.suspicious_clauses.length > 0) {
      message += "Suspicious Clauses\n";
      structured.suspicious_clauses.forEach((clause) => {
        message += `- ${clause}\n`;
      });
      message += "\n";
    }

    if (Array.isArray(structured.warnings) && structured.warnings.length > 1) {
      message += "Additional Warnings\n";
      structured.warnings.slice(1).forEach((warning) => {
        message += `- ${warning}\n`;
      });
      message += "\n";
    }
  } else if (analysis?.summary) {
    message += `${analysis.summary}\n\n`;
  }

  if (analysis?.risks?.length) {
    const visibleRisks = analysis.risks.filter((risk) => !isUrgencyLikeLegacyRisk(risk));

    if (visibleRisks.length > 0) {
    message += "Detected Risks\n";
    visibleRisks.forEach((risk) => {
      message += `- ${getRiskEmoji(risk.severity)} ${risk.clause}: ${risk.reason}\n`;
    });
    }
  }

  return message.trim() || "Analysis completed.";
}

export function formatQuickSummary(response) {
  if (!response || !response.success) {
    return "Analysis failed";
  }

  const analysis = response.data?.analysis;
  const structured = analysis?.structured;

  if (structured?.document_type) {
    return `${structured.document_type} • ${analysis?.riskStatistics?.total || 0} risk(s)`;
  }

  const riskStatistics = analysis?.riskStatistics;
  if (!riskStatistics || riskStatistics.total === 0) {
    return "No major risks detected";
  }

  return `Found ${riskStatistics.total} risk(s)`;
}

export function formatPrivacyInfo(privacy) {
  if (!privacy) {
    return "";
  }

  if (privacy.protected) {
    return `Protected ${privacy.fieldsProtected} sensitive field(s)`;
  }

  return "No sensitive data detected";
}

export function getRiskColor(severity) {
  switch (severity?.toUpperCase()) {
    case "HIGH":
      return "text-red-600";
    case "MEDIUM":
      return "text-yellow-600";
    case "LOW":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
}
