"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Check, AlertCircle, Bug } from "lucide-react"

interface BugReportFormProps {
  onSuccess?: () => void
}

type FeedbackType = "bug" | "feature" | "improvement" | "other"
type Priority = "low" | "medium" | "high" | "critical"

export function BugReportForm({ onSuccess }: BugReportFormProps) {
  const [type, setType] = useState<FeedbackType>("bug")
  const [priority, setPriority] = useState<Priority>("medium")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [stepsToReproduce, setStepsToReproduce] = useState("")
  const [expectedBehavior, setExpectedBehavior] = useState("")
  const [actualBehavior, setActualBehavior] = useState("")
  const [browserInfo, setBrowserInfo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")
    setErrorMessage("")

    // Collect browser info automatically
    const browserDetails = {
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      platform: navigator.platform,
      language: navigator.language,
      ...browserInfo ? { additionalInfo: browserInfo } : {}
    }

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          priority,
          title,
          description,
          stepsToReproduce: type === "bug" ? stepsToReproduce : undefined,
          expectedBehavior: type === "bug" ? expectedBehavior : undefined,
          actualBehavior: type === "bug" ? actualBehavior : undefined,
          browserInfo: browserDetails,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to submit feedback")
      }

      setSubmitStatus("success")

      // Reset form
      setTimeout(() => {
        setTitle("")
        setDescription("")
        setStepsToReproduce("")
        setExpectedBehavior("")
        setActualBehavior("")
        setBrowserInfo("")
        setType("bug")
        setPriority("medium")
        setSubmitStatus("idle")
        onSuccess?.()
      }, 2000)
    } catch (error) {
      console.error("Error submitting feedback:", error)
      setSubmitStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Bug className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Report an Issue or Share Feedback</h2>
          <p className="text-sm text-muted-foreground">
            Help us improve SmartBudget by reporting bugs or suggesting improvements
          </p>
        </div>
      </div>

      {submitStatus === "success" && (
        <Alert className="animate-in fade-in slide-in-from-top-2 duration-300 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400 animate-in zoom-in duration-300" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Thank you! Your feedback has been submitted successfully.
          </AlertDescription>
        </Alert>
      )}

      {submitStatus === "error" && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(value) => setType(value as FeedbackType)}>
            <SelectTrigger id="type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bug">Bug Report</SelectItem>
              <SelectItem value="feature">Feature Request</SelectItem>
              <SelectItem value="improvement">Improvement Suggestion</SelectItem>
              <SelectItem value="other">Other Feedback</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
            <SelectTrigger id="priority">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical (App Unusable)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Brief summary of the issue or suggestion"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          required
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Provide a detailed description..."
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          required
          rows={4}
          className="resize-none"
        />
      </div>

      {type === "bug" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="steps">Steps to Reproduce</Label>
            <Textarea
              id="steps"
              placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
              value={stepsToReproduce}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStepsToReproduce(e.target.value)}
              rows={4}
              className="resize-none font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Help us reproduce the bug by listing the exact steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected">Expected Behavior</Label>
              <Textarea
                id="expected"
                placeholder="What should happen?"
                value={expectedBehavior}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setExpectedBehavior(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual">Actual Behavior</Label>
              <Textarea
                id="actual"
                placeholder="What actually happens?"
                value={actualBehavior}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setActualBehavior(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="browser">Additional Information</Label>
        <Textarea
          id="browser"
          placeholder="Any other details that might help (screenshots description, etc.)"
          value={browserInfo}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBrowserInfo(e.target.value)}
          rows={2}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Browser info will be collected automatically
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isSubmitting || !title || !description}
          className="min-w-32"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Feedback"
          )}
        </Button>
      </div>
    </form>
  )
}
