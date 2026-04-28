"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { User, Key, Bell, Palette, Database, Shield } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 pl-64">
        <AppHeader title="Settings" description="Manage your preferences" />
        <main className="p-6">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-muted">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="api">API Keys</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-accent/20 p-2">
                      <User className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">Profile Information</CardTitle>
                      <CardDescription>Update your personal details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-foreground">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        className="bg-input border-border text-foreground"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organization" className="text-foreground">Organization</Label>
                    <Input
                      id="organization"
                      placeholder="Acme Inc."
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-foreground">Role</Label>
                    <Select>
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="security">Security Engineer</SelectItem>
                        <SelectItem value="architect">Software Architect</SelectItem>
                        <SelectItem value="manager">Engineering Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Keys Tab */}
            <TabsContent value="api" className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-accent/20 p-2">
                      <Key className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">API Configuration</CardTitle>
                      <CardDescription>
                        Configure external service integrations
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="serpapi" className="text-foreground">SerpApi Key</Label>
                      <Input
                        id="serpapi"
                        type="password"
                        placeholder="Enter your SerpApi key"
                        className="bg-input border-border text-foreground"
                      />
                      <p className="text-xs text-muted-foreground">
                        Used for Google Scholar research searches
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="openai" className="text-foreground">OpenAI API Key</Label>
                      <Input
                        id="openai"
                        type="password"
                        placeholder="Enter your OpenAI API key"
                        className="bg-input border-border text-foreground"
                      />
                      <p className="text-xs text-muted-foreground">
                        Used for LangChain4j AI analysis
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="github" className="text-foreground">GitHub Token</Label>
                      <Input
                        id="github"
                        type="password"
                        placeholder="Enter your GitHub token"
                        className="bg-input border-border text-foreground"
                      />
                      <p className="text-xs text-muted-foreground">
                        Used for repository code analysis
                      </p>
                    </div>
                  </div>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Save API Keys
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-accent/20 p-2">
                      <Database className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">Knowledge Base</CardTitle>
                      <CardDescription>Manage your document storage settings</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Auto-save Research</p>
                      <p className="text-xs text-muted-foreground">
                        Automatically save found articles to knowledge base
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Vector Embeddings</p>
                      <p className="text-xs text-muted-foreground">
                        Enable semantic search in knowledge base
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-accent/20 p-2">
                      <Bell className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">Notification Preferences</CardTitle>
                      <CardDescription>Choose what updates you receive</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Analysis Complete</p>
                      <p className="text-xs text-muted-foreground">
                        Notify when application analysis is finished
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Critical Issues</p>
                      <p className="text-xs text-muted-foreground">
                        Alert for critical security issues found
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">New Research</p>
                      <p className="text-xs text-muted-foreground">
                        Notify when new relevant articles are found
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Marketplace Updates</p>
                      <p className="text-xs text-muted-foreground">
                        Updates about new configurations in marketplace
                      </p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-accent/20 p-2">
                      <Palette className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">Appearance</CardTitle>
                      <CardDescription>Customize the look and feel</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Theme</Label>
                    <Select defaultValue="dark">
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Code Theme</Label>
                    <Select defaultValue="monokai">
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monokai">Monokai</SelectItem>
                        <SelectItem value="github-dark">GitHub Dark</SelectItem>
                        <SelectItem value="dracula">Dracula</SelectItem>
                        <SelectItem value="nord">Nord</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Compact Mode</p>
                      <p className="text-xs text-muted-foreground">
                        Reduce spacing for denser UI
                      </p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-accent/20 p-2">
                      <Shield className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">Default Analysis Settings</CardTitle>
                      <CardDescription>Configure default options for new analyses</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Default Framework</Label>
                    <Select defaultValue="spring">
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spring">Spring Boot</SelectItem>
                        <SelectItem value="quarkus">Quarkus</SelectItem>
                        <SelectItem value="micronaut">Micronaut</SelectItem>
                        <SelectItem value="jakarta">Jakarta EE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Default Log Format</Label>
                    <Select defaultValue="json">
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON Structured</SelectItem>
                        <SelectItem value="ecs">Elastic Common Schema</SelectItem>
                        <SelectItem value="logback">Logback Pattern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
