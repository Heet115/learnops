"use client";

import { UserProfile } from "@clerk/nextjs";
import { Shield } from "lucide-react";

export function SecuritySettings() {
  return (
    <div className="security-settings-page space-y-6 pt-4">
      <style jsx global>{`
        /* Hide navigation */
        .security-settings-page .cl-navbar,
        .security-settings-page .cl-navbarMobileMenuButton,
        .security-settings-page .cl-navbarMobileMenuRow {
          display: none !important;
        }

        /* Hide all profile/account related sections */
        .security-settings-page .cl-profileSection__profile,
        .security-settings-page .cl-profileSection__username,
        .security-settings-page .cl-profileSection__emailAddresses,
        .security-settings-page .cl-profileSection__phoneNumbers,
        .security-settings-page .cl-profileSection__connectedAccounts,
        .security-settings-page .cl-profileSection__enterpriseAccounts,
        .security-settings-page .cl-profileSection__web3Wallets,
        .security-settings-page .cl-profileSection__danger,
        .security-settings-page .cl-profileSection__deleteAccount {
          display: none !important;
        }

        /* Hide profile page header */
        .security-settings-page .cl-headerTitle,
        .security-settings-page .cl-headerSubtitle {
          display: none !important;
        }

        /* Hide the account/profile page entirely */
        .security-settings-page .cl-page[data-page="account"],
        .security-settings-page .cl-profilePage__account {
          display: none !important;
        }
      `}</style>

      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold tracking-tight">Security Settings</h1>
      </div>
      <p className="text-muted-foreground">
        Manage your password, two-factor authentication, and active sessions.
      </p>

      <div className="max-w-4xl">
        <UserProfile
          path="/settings/security"
          appearance={{
            elements: {
              rootBox: "w-full",
              cardBox: "w-full shadow-none border rounded-lg",
              scrollBox: "bg-transparent",
              pageScrollBox: "p-4",
            },
          }}
        >
          <UserProfile.Page label="security" />
        </UserProfile>
      </div>
    </div>
  );
}
