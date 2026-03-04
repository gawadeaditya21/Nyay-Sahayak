// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ANALYSIS FORMATTER - Format API responses for display
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Purpose: Convert backend analysis results into user-friendly messages
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Format the complete analysis response into a readable message
 * 
 * @param {Object} response - API response from analyzeDocument or analyzeText
 * @returns {string} Formatted message for chat display
 */
export function formatAnalysisResponse(response) {
  if (!response || !response.success) {
    return "❌ Analysis failed. Please try again.";
  }
  
  const { data } = response;
  const { document, privacy, analysis, metadata } = data;
  
  let message = "";
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Document Information (if available)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (document) {
    message += "📄 **Document Information**\n";
    message += `• File: ${document.fileName}\n`;
    message += `• Size: ${(document.fileSize / 1024).toFixed(2)} KB\n`;
    message += `• Pages: ${document.pages}\n`;
    message += `• Extracted: ${document.textLength.toLocaleString()} characters\n`;
    message += `\n`;
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Privacy Protection
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (privacy) {
    message += "🔒 **Privacy Protection**\n";
    if (privacy.protected) {
      message += `✅ Protected ${privacy.fieldsProtected} sensitive field(s)\n`;
      const dataTypes = privacy.dataTypes.join(", ");
      message += `• Types: ${dataTypes}\n`;
    } else {
      message += "ℹ️ No sensitive data detected\n";
    }
    message += `\n`;
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Analysis Summary
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (analysis) {
    message += "📊 **Analysis Summary**\n";
    message += `${analysis.summary}\n\n`;
    
    // Risk Statistics
    const { riskStatistics } = analysis;
    if (riskStatistics && riskStatistics.total > 0) {
      message += `⚠️ **Identified Risks: ${riskStatistics.total}**\n`;
      message += `• 🔴 High: ${riskStatistics.high}\n`;
      message += `• 🟡 Medium: ${riskStatistics.medium}\n`;
      message += `• 🟢 Low: ${riskStatistics.low}\n\n`;
      
      // List each risk
      message += "**Risk Details:**\n\n";
      analysis.risks.forEach((risk, index) => {
        const emoji = getRiskEmoji(risk.severity);
        message += `${emoji} **Risk ${index + 1}: ${risk.clause}**\n`;
        message += `   Severity: ${risk.severity}\n`;
        message += `   ${risk.reason}\n\n`;
      });
    } else {
      message += "✅ **No significant risks detected**\n\n";
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Professional Disclaimer
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  message += "\n---\n";
  message += "⚖️ *This is an AI-powered analysis. Always consult a legal professional for important decisions.*";
  
  return message;
}

/**
 * Get emoji for risk severity level
 * @param {string} severity - Risk severity (HIGH, MEDIUM, LOW)
 * @returns {string} Emoji representation
 */
function getRiskEmoji(severity) {
  switch (severity?.toUpperCase()) {
    case "HIGH":
      return "🔴";
    case "MEDIUM":
      return "🟡";
    case "LOW":
      return "🟢";
    default:
      return "⚪";
  }
}

/**
 * Format a simple summary for quick display
 * 
 * @param {Object} response - API response
 * @returns {string} Short summary message
 */
export function formatQuickSummary(response) {
  if (!response || !response.success) {
    return "Analysis failed";
  }
  
  const { analysis } = response.data;
  const { riskStatistics } = analysis;
  
  if (!riskStatistics || riskStatistics.total === 0) {
    return "✅ No risks detected";
  }
  
  return `⚠️ Found ${riskStatistics.total} risk(s): ${riskStatistics.high} high, ${riskStatistics.medium} medium, ${riskStatistics.low} low`;
}

/**
 * Format privacy info for display
 * 
 * @param {Object} privacy - Privacy object from API response
 * @returns {string} Privacy info message
 */
export function formatPrivacyInfo(privacy) {
  if (!privacy) return "";
  
  if (privacy.protected) {
    return `🔒 Protected ${privacy.fieldsProtected} sensitive field(s) (${privacy.dataTypes.join(", ")})`;
  }
  
  return "🔒 No sensitive data detected";
}

/**
 * Get risk severity color for UI styling
 * 
 * @param {string} severity - Risk severity
 * @returns {string} Color class name
 */
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
