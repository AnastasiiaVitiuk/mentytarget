"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          Settings
        </h2>
        <p className="text-muted-foreground text-sm">
          Manage your account and subscription.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Your profile information.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground text-sm">Name</span>
            <span className="text-foreground text-sm font-medium">
              Dr. Alex Morgan
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground text-sm">Email</span>
            <span className="text-foreground text-sm font-medium">
              a.morgan@neurolab.org
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan</CardTitle>
          <CardDescription>Your current subscription tier.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground text-sm font-medium">
              Professional
            </span>
            <span className="text-muted-foreground text-xs">
              Unlimited analyses · Document generation · Priority compute
            </span>
          </div>
          <Badge>Professional</Badge>
        </CardContent>
      </Card>
    </div>
  )
}
