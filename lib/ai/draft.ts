/**
 * Reply-draft generator. Produces a DRAFT only — never auto-posts.
 * Tone depends on the star rating; language mirrors the review when detectable.
 *
 * This uses smart templates (no external AI key required). A real LLM can be
 * plugged in later behind the same interface.
 */

export type DraftInput = {
  rating: number | null;
  text: string | null;
  reviewerName?: string | null;
  businessName?: string | null;
};

function isArabic(text: string): boolean {
  return /[؀-ۿ]/.test(text);
}

function firstName(name?: string | null): string {
  if (!name) return "";
  return name.trim().split(/\s+/)[0] ?? "";
}

export function generateDraft(input: DraftInput): string {
  const rating = input.rating ?? 0;
  const ar = isArabic(input.text ?? "");
  const name = firstName(input.reviewerName);
  const biz = input.businessName?.trim() || (ar ? "فريقنا" : "our team");

  if (ar) {
    const hi = name ? `مرحباً ${name}،` : "مرحباً،";
    if (rating >= 4) {
      return `${hi} شكراً جزيلاً على كلماتك الطيبة وتقييمك الرائع! سعداء جداً بزيارتك ونتطلّع لخدمتك مرة أخرى قريباً. — ${biz}`;
    }
    if (rating === 3) {
      return `${hi} شكراً على ملاحظاتك القيّمة. نحرص دائماً على التحسّن — يسعدنا لو تخبرنا بالمزيد لنطوّر تجربتك في المرة القادمة. — ${biz}`;
    }
    return `${hi} نأسف بصدق لأن تجربتك لم تكن على المستوى المتوقّع، ونأخذ ملاحظتك على محمل الجد. نودّ التواصل معك لمعالجة الأمر — شكراً لإتاحة الفرصة لنا للتحسّن. — ${biz}`;
  }

  const hi = name ? `Hi ${name},` : "Hello,";
  if (rating >= 4) {
    return `${hi} thank you so much for the kind words and the great rating! We're delighted you enjoyed your visit and can't wait to welcome you back. — ${biz}`;
  }
  if (rating === 3) {
    return `${hi} thanks for taking the time to share your feedback. We're always working to improve — we'd love to hear more about what would have made your experience better. — ${biz}`;
  }
  return `${hi} we're truly sorry your experience didn't meet expectations, and we take your feedback seriously. We'd like to make it right — please reach out so we can help. Thank you for giving us the chance to improve. — ${biz}`;
}

/** Guidance shown next to the draft, by rating band. */
export function draftTone(rating: number | null): string {
  const r = rating ?? 0;
  if (r >= 4) return "Warm thank-you";
  if (r === 3) return "Polite, invite more feedback";
  return "Calm & apologetic — review carefully before posting";
}
