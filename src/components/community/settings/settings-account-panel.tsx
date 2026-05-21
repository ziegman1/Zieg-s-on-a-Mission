"use client";

import { useState, useTransition } from "react";
import { changePasswordAction } from "@/app/(storefront)/community/settings-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SettingsFieldGroup,
  SettingsPanel,
  SettingsSaveButton,
} from "./settings-ui";

export function SettingsAccountPanel() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <SettingsPanel
        title="Password"
        description="Update the password you use to sign in to Mission Hub."
        footer={<SettingsSaveButton pending={pending} label="Update password" />}
      >
        <SettingsFieldGroup>
          <div className="space-y-1.5">
            <Label htmlFor="current-pw">Current password</Label>
            <Input
              id="current-pw"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-pw">New password</Label>
            <Input
              id="new-pw"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pw">Confirm new password</Label>
            <Input
              id="confirm-pw"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="bg-white"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? (
            <p className="text-sm text-brand-primary font-medium">Password updated.</p>
          ) : null}
        </SettingsFieldGroup>
      </SettingsPanel>
    </form>
  );
}
