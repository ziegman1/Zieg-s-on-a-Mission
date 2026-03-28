"use client";

import type { SiteCopy } from "@/data/site-copy-defaults";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-zinc-300">{label}</Label>
      {children}
    </div>
  );
}

type SetCopy = React.Dispatch<React.SetStateAction<SiteCopy>>;

export function MarketingPagesEditor({ copy, setCopy }: { copy: SiteCopy; setCopy: SetCopy }) {
  const pp = copy.partnerPage;
  const gp = copy.givePage;
  const mp = copy.merchPage;

  return (
    <>
      <details className="rounded-lg border border-brand-primary/30 bg-zinc-900/50 p-4">
        <summary className="cursor-pointer font-medium text-brand-primary">
          Page: Partner (/partner)
        </summary>
        <div className="mt-4 space-y-4">
          <Field label="Meta title">
            <Input
              value={pp.metaTitle}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, metaTitle: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Meta description">
            <Textarea
              rows={2}
              value={pp.metaDescription}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, metaDescription: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Hero — eyebrow">
            <Input
              value={pp.heroEyebrow}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, heroEyebrow: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Hero — title">
            <Input
              value={pp.heroTitle}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, heroTitle: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Hero — body">
            <Textarea
              rows={4}
              value={pp.heroBody}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, heroBody: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Primary CTA label (monthly)">
            <Input
              value={pp.primaryCtaLabel}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, primaryCtaLabel: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Secondary CTA label (one-time)">
            <Input
              value={pp.secondaryCtaLabel}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, secondaryCtaLabel: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Why partnership — heading">
            <Input
              value={pp.whyHeading}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, whyHeading: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Why partnership — paragraph 1">
            <Textarea
              rows={3}
              value={pp.whyBodyParagraph1}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, whyBodyParagraph1: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Why partnership — paragraph 2">
            <Textarea
              rows={3}
              value={pp.whyBodyParagraph2}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, whyBodyParagraph2: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Tiers section — heading">
            <Input
              value={pp.tiersHeading}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, tiersHeading: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Tiers section — intro">
            <Textarea
              rows={2}
              value={pp.tiersIntro}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, tiersIntro: e.target.value },
                }))
              }
            />
          </Field>
          <p className="text-xs text-zinc-500">
            Partnership tiers ({pp.tiers.length} rows — same list appears on Give page)
          </p>
          {pp.tiers.map((tier, i) => (
            <div
              key={i}
              className="rounded-md border border-zinc-700 p-3 space-y-3"
            >
              <p className="text-sm font-medium text-zinc-400">Tier {i + 1}</p>
              <Field label="Amount label">
                <Input
                  value={tier.amountLabel}
                  onChange={(e) =>
                    setCopy((c) => {
                      const tiers = [...c.partnerPage.tiers];
                      tiers[i] = { ...tiers[i]!, amountLabel: e.target.value };
                      return { ...c, partnerPage: { ...c.partnerPage, tiers } };
                    })
                  }
                />
              </Field>
              <Field label="Name">
                <Input
                  value={tier.name}
                  onChange={(e) =>
                    setCopy((c) => {
                      const tiers = [...c.partnerPage.tiers];
                      tiers[i] = { ...tiers[i]!, name: e.target.value };
                      return { ...c, partnerPage: { ...c.partnerPage, tiers } };
                    })
                  }
                />
              </Field>
              <Field label="Description">
                <Textarea
                  rows={3}
                  value={tier.description}
                  onChange={(e) =>
                    setCopy((c) => {
                      const tiers = [...c.partnerPage.tiers];
                      tiers[i] = { ...tiers[i]!, description: e.target.value };
                      return { ...c, partnerPage: { ...c.partnerPage, tiers } };
                    })
                  }
                />
              </Field>
              <Field label="Gift note">
                <Textarea
                  rows={2}
                  value={tier.giftNote}
                  onChange={(e) =>
                    setCopy((c) => {
                      const tiers = [...c.partnerPage.tiers];
                      tiers[i] = { ...tiers[i]!, giftNote: e.target.value };
                      return { ...c, partnerPage: { ...c.partnerPage, tiers } };
                    })
                  }
                />
              </Field>
            </div>
          ))}
          <Field label="Thank-you gifts — heading">
            <Input
              value={pp.thankYouHeading}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, thankYouHeading: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Thank-you gifts — paragraph 1">
            <Textarea
              rows={3}
              value={pp.thankYouParagraph1}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, thankYouParagraph1: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Thank-you gifts — paragraph 2">
            <Textarea
              rows={3}
              value={pp.thankYouParagraph2}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, thankYouParagraph2: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Milestones — heading">
            <Input
              value={pp.milestonesHeading}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, milestonesHeading: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Milestones — intro">
            <Textarea
              rows={2}
              value={pp.milestonesIntro}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, milestonesIntro: e.target.value },
                }))
              }
            />
          </Field>
          {pp.milestones.map((m, i) => (
            <div
              key={i}
              className="rounded-md border border-zinc-700 p-3 space-y-3"
            >
              <p className="text-sm font-medium text-zinc-400">Milestone {i + 1}</p>
              <Field label="When">
                <Input
                  value={m.when}
                  onChange={(e) =>
                    setCopy((c) => {
                      const milestones = [...c.partnerPage.milestones];
                      milestones[i] = { ...milestones[i]!, when: e.target.value };
                      return { ...c, partnerPage: { ...c.partnerPage, milestones } };
                    })
                  }
                />
              </Field>
              <Field label="Title">
                <Input
                  value={m.title}
                  onChange={(e) =>
                    setCopy((c) => {
                      const milestones = [...c.partnerPage.milestones];
                      milestones[i] = { ...milestones[i]!, title: e.target.value };
                      return { ...c, partnerPage: { ...c.partnerPage, milestones } };
                    })
                  }
                />
              </Field>
              <Field label="Description">
                <Textarea
                  rows={3}
                  value={m.description}
                  onChange={(e) =>
                    setCopy((c) => {
                      const milestones = [...c.partnerPage.milestones];
                      milestones[i] = { ...milestones[i]!, description: e.target.value };
                      return { ...c, partnerPage: { ...c.partnerPage, milestones } };
                    })
                  }
                />
              </Field>
            </div>
          ))}
          <Field label="Impact — heading">
            <Input
              value={pp.impactHeading}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, impactHeading: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Impact — intro">
            <Textarea
              rows={2}
              value={pp.impactIntro}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, impactIntro: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Impact bullets (one per line)">
            <Textarea
              rows={6}
              value={pp.impactBullets.join("\n")}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: {
                    ...c.partnerPage,
                    impactBullets: e.target.value
                      .split("\n")
                      .map((l) => l.trim())
                      .filter(Boolean),
                  },
                }))
              }
            />
          </Field>
          <Field label="Compliance box — title">
            <Input
              value={pp.complianceBoxTitle}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, complianceBoxTitle: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Compliance box — body">
            <Textarea
              rows={4}
              value={pp.complianceBoxBody}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, complianceBoxBody: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Final band — heading">
            <Input
              value={pp.finalHeading}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, finalHeading: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Final band — body">
            <Textarea
              rows={2}
              value={pp.finalBody}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, finalBody: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Final — primary CTA">
            <Input
              value={pp.finalPrimaryCtaLabel}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, finalPrimaryCtaLabel: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Final — secondary CTA">
            <Input
              value={pp.finalSecondaryCtaLabel}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, finalSecondaryCtaLabel: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Final — contact CTA">
            <Input
              value={pp.finalContactCtaLabel}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  partnerPage: { ...c.partnerPage, finalContactCtaLabel: e.target.value },
                }))
              }
            />
          </Field>
        </div>
      </details>

      <details className="rounded-lg border border-brand-primary/30 bg-zinc-900/50 p-4">
        <summary className="cursor-pointer font-medium text-brand-primary">Page: Give (/give)</summary>
        <p className="mt-2 text-xs text-zinc-500">
          Suggested monthly levels use the same tiers as the Partner page (edit tiers above).
        </p>
        <div className="mt-4 space-y-4">
          <Field label="Meta title">
            <Input
              value={gp.metaTitle}
              onChange={(e) =>
                setCopy((c) => ({ ...c, givePage: { ...c.givePage, metaTitle: e.target.value } }))
              }
            />
          </Field>
          <Field label="Meta description">
            <Textarea
              rows={2}
              value={gp.metaDescription}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  givePage: { ...c.givePage, metaDescription: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Kicker">
            <Input
              value={gp.kicker}
              onChange={(e) =>
                setCopy((c) => ({ ...c, givePage: { ...c.givePage, kicker: e.target.value } }))
              }
            />
          </Field>
          <Field label="Title">
            <Input
              value={gp.title}
              onChange={(e) =>
                setCopy((c) => ({ ...c, givePage: { ...c.givePage, title: e.target.value } }))
              }
            />
          </Field>
          <Field label="Intro paragraph">
            <Textarea
              rows={3}
              value={gp.intro}
              onChange={(e) =>
                setCopy((c) => ({ ...c, givePage: { ...c.givePage, intro: e.target.value } }))
              }
            />
          </Field>
          <Field label="Monthly section — heading">
            <Input
              value={gp.monthlySectionHeading}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  givePage: { ...c.givePage, monthlySectionHeading: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Monthly section — body">
            <Textarea
              rows={3}
              value={gp.monthlySectionBody}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  givePage: { ...c.givePage, monthlySectionBody: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Start monthly CTA">
            <Input
              value={gp.startMonthlyCta}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  givePage: { ...c.givePage, startMonthlyCta: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Learn partnership CTA">
            <Input
              value={gp.learnPartnerCta}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  givePage: { ...c.givePage, learnPartnerCta: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Suggested levels — heading">
            <Input
              value={gp.suggestedLevelsHeading}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  givePage: { ...c.givePage, suggestedLevelsHeading: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Suggested levels — intro">
            <Textarea
              rows={2}
              value={gp.suggestedLevelsIntro}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  givePage: { ...c.givePage, suggestedLevelsIntro: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Become monthly CTA">
            <Input
              value={gp.becomeMonthlyCta}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  givePage: { ...c.givePage, becomeMonthlyCta: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="One-time — heading">
            <Input
              value={gp.oneTimeHeading}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  givePage: { ...c.givePage, oneTimeHeading: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="One-time — body">
            <Textarea
              rows={3}
              value={gp.oneTimeBody}
              onChange={(e) =>
                setCopy((c) => ({ ...c, givePage: { ...c.givePage, oneTimeBody: e.target.value } }))
              }
            />
          </Field>
          <Field label="One-time suggestion chips (one per line)">
            <Textarea
              rows={4}
              value={gp.oneTimeSuggestions.join("\n")}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  givePage: {
                    ...c.givePage,
                    oneTimeSuggestions: e.target.value
                      .split("\n")
                      .map((l) => l.trim())
                      .filter(Boolean),
                  },
                }))
              }
            />
          </Field>
          <Field label="One-time CTA label">
            <Input
              value={gp.oneTimeCta}
              onChange={(e) =>
                setCopy((c) => ({ ...c, givePage: { ...c.givePage, oneTimeCta: e.target.value } }))
              }
            />
          </Field>
          <Field label="Thank-you — heading">
            <Input
              value={gp.thankYouHeading}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  givePage: { ...c.givePage, thankYouHeading: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Thank-you — text before partner link">
            <Textarea
              rows={3}
              value={gp.thankYouBeforePartnerLink}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  givePage: { ...c.givePage, thankYouBeforePartnerLink: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Thank-you — partner link label">
            <Input
              value={gp.thankYouPartnerLinkLabel}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  givePage: { ...c.givePage, thankYouPartnerLinkLabel: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Thank-you — text after partner link">
            <Input
              value={gp.thankYouAfterPartnerLink}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  givePage: { ...c.givePage, thankYouAfterPartnerLink: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Compliance — heading">
            <Input
              value={gp.complianceHeading}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  givePage: { ...c.givePage, complianceHeading: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Compliance — body">
            <Textarea
              rows={4}
              value={gp.complianceBody}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  givePage: { ...c.givePage, complianceBody: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Footer — contact CTA">
            <Input
              value={gp.footerContactCta}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  givePage: { ...c.givePage, footerContactCta: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Footer — partner CTA">
            <Input
              value={gp.footerPartnerCta}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  givePage: { ...c.givePage, footerPartnerCta: e.target.value },
                }))
              }
            />
          </Field>
        </div>
      </details>

      <details className="rounded-lg border border-brand-primary/30 bg-zinc-900/50 p-4">
        <summary className="cursor-pointer font-medium text-brand-primary">Page: Merch (/merch)</summary>
        <div className="mt-4 space-y-4">
          <Field label="Kicker">
            <Input
              value={mp.kicker}
              onChange={(e) =>
                setCopy((c) => ({ ...c, merchPage: { ...c.merchPage, kicker: e.target.value } }))
              }
            />
          </Field>
          <Field label="Title">
            <Input
              value={mp.title}
              onChange={(e) =>
                setCopy((c) => ({ ...c, merchPage: { ...c.merchPage, title: e.target.value } }))
              }
            />
          </Field>
          <Field label="Intro">
            <Textarea
              rows={4}
              value={mp.intro}
              onChange={(e) =>
                setCopy((c) => ({ ...c, merchPage: { ...c.merchPage, intro: e.target.value } }))
              }
            />
          </Field>
          <Field label="Thank-you — heading">
            <Input
              value={mp.thankYouHeading}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  merchPage: { ...c.merchPage, thankYouHeading: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Thank-you — text before partner link">
            <Textarea
              rows={3}
              value={mp.thankYouBeforePartnerLink}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  merchPage: { ...c.merchPage, thankYouBeforePartnerLink: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Thank-you — partner link label">
            <Input
              value={mp.thankYouPartnerLinkLabel}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  merchPage: { ...c.merchPage, thankYouPartnerLinkLabel: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Thank-you — text after partner link">
            <Input
              value={mp.thankYouAfterPartnerLink}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  merchPage: { ...c.merchPage, thankYouAfterPartnerLink: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Collection — heading">
            <Input
              value={mp.collectionHeading}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  merchPage: { ...c.merchPage, collectionHeading: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Collection — body">
            <Textarea
              rows={3}
              value={mp.collectionBody}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  merchPage: { ...c.merchPage, collectionBody: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="CTA — partner">
            <Input
              value={mp.ctaPartner}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  merchPage: { ...c.merchPage, ctaPartner: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="CTA — give">
            <Input
              value={mp.ctaGive}
              onChange={(e) =>
                setCopy((c) => ({ ...c, merchPage: { ...c.merchPage, ctaGive: e.target.value } }))
              }
            />
          </Field>
          <Field label="CTA — contact">
            <Input
              value={mp.ctaContact}
              onChange={(e) =>
                setCopy((c) => ({
                  ...c,
                  merchPage: { ...c.merchPage, ctaContact: e.target.value },
                }))
              }
            />
          </Field>
          <Field label="Back to home label">
            <Input
              value={mp.backHome}
              onChange={(e) =>
                setCopy((c) => ({ ...c, merchPage: { ...c.merchPage, backHome: e.target.value } }))
              }
            />
          </Field>
        </div>
      </details>
    </>
  );
}
