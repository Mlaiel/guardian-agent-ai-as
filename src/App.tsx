/*
 * Owner: Fahed Mlaiel
 * Contact: mlaiel@live.de
 * Notice: "Attribution to Fahed Mlaiel is mandatory in all copies, forks, and derivatives."
 */

import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Progress } from '@/components/ui/progress'
import { Shield, Heart, Phone, Eye, Ear, Warning, Settings, Users, MessageSquare } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string
  priority: number
}

interface UserProfile {
  name: string
  emergencyContacts: EmergencyContact[]
  medicalInfo: string
  preferences: {
    hapticFeedback: boolean
    visualAlerts: boolean
    autoSOS: boolean
    sosCountdown: number
  }
}

function App() {
  const [userProfile, setUserProfile] = useKV<UserProfile>('guardian-profile', {
    name: '',
    emergencyContacts: [],
    medicalInfo: '',
    preferences: {
      hapticFeedback: true,
      visualAlerts: true,
      autoSOS: true,
      sosCountdown: 10
    }
  })

  const [isListening, setIsListening] = useKV('hazard-monitoring', false)
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [sosCountdown, setSosCountdown] = useState(0)
  const [lastAlert, setLastAlert] = useKV<string | null>('last-alert', null)

  // SOS Emergency System
  const triggerSOS = () => {
    setEmergencyMode(true)
    setSosCountdown(userProfile.preferences.sosCountdown)
    
    // Vibrate if supported
    if (navigator.vibrate && userProfile.preferences.hapticFeedback) {
      navigator.vibrate([200, 100, 200, 100, 200])
    }
    
    toast.error('EMERGENCY MODE ACTIVATED', {
      description: `SOS will activate in ${userProfile.preferences.sosCountdown} seconds`,
      duration: userProfile.preferences.sosCountdown * 1000
    })
  }

  const cancelSOS = () => {
    setEmergencyMode(false)
    setSosCountdown(0)
    toast.success('Emergency cancelled', {
      description: 'SOS has been deactivated'
    })
  }

  // Countdown effect for SOS
  useEffect(() => {
    if (emergencyMode && sosCountdown > 0) {
      const timer = setTimeout(() => {
        setSosCountdown(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (emergencyMode && sosCountdown === 0) {
      // Trigger actual emergency call
      executeSOS()
    }
  }, [emergencyMode, sosCountdown])

  const executeSOS = () => {
    toast.error('SOS ACTIVATED - EMERGENCY SERVICES CONTACTED', {
      description: 'Emergency contacts have been notified',
      duration: 10000
    })
    
    // In a real app, this would:
    // 1. Send location to emergency contacts
    // 2. Call emergency services
    // 3. Send medical info to responders
    
    setEmergencyMode(false)
    setSosCountdown(0)
  }

  // Hazard Detection Simulation
  const toggleHazardMonitoring = () => {
    setIsListening(prev => {
      const newState = !prev
      if (newState) {
        toast.success('Hazard detection enabled', {
          description: 'Monitoring environmental sounds'
        })
        // Simulate random hazard detection
        setTimeout(() => simulateHazardDetection(), Math.random() * 10000 + 5000)
      } else {
        toast.info('Hazard detection disabled')
      }
      return newState
    })
  }

  const simulateHazardDetection = () => {
    if (!isListening) return
    
    const hazards = [
      { type: 'Vehicle Approaching', severity: 'high', action: 'Step to safety' },
      { type: 'Emergency Siren', severity: 'medium', action: 'Be aware of emergency vehicles' },
      { type: 'Construction Noise', severity: 'low', action: 'Construction zone ahead' }
    ]
    
    const hazard = hazards[Math.floor(Math.random() * hazards.length)]
    setLastAlert(`${hazard.type}: ${hazard.action}`)
    
    // Vibrate for hazard alert
    if (navigator.vibrate && userProfile.preferences.hapticFeedback) {
      const pattern = hazard.severity === 'high' ? [100, 50, 100, 50, 100] : [200]
      navigator.vibrate(pattern)
    }
    
    toast.warning(`⚠️ ${hazard.type}`, {
      description: hazard.action,
      duration: 5000
    })
    
    // Schedule next random detection
    setTimeout(() => simulateHazardDetection(), Math.random() * 15000 + 10000)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Shield size={40} className="text-primary" weight="fill" />
            <h1 className="text-4xl font-bold text-foreground">Guardian-Agent 1</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            AI-powered accessibility assistant for Deaf and Hard-of-Hearing individuals
          </p>
          <div className="text-sm text-muted-foreground">
            Owner: Fahed Mlaiel | Contact: mlaiel@live.de
          </div>
        </div>

        {/* Emergency SOS Card */}
        <Card className="border-2 border-destructive/20 bg-gradient-to-br from-destructive/5 to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Heart size={24} weight="fill" />
              Emergency SOS
            </CardTitle>
            <CardDescription>
              Immediate emergency response system with automatic escalation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {emergencyMode ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-6xl font-bold text-destructive mb-2">
                    {sosCountdown}
                  </div>
                  <p className="text-lg text-destructive">Emergency activation in progress</p>
                  <Progress value={(userProfile.preferences.sosCountdown - sosCountdown) / userProfile.preferences.sosCountdown * 100} className="mt-4" />
                </div>
                <Button 
                  onClick={cancelSOS}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Cancel Emergency
                </Button>
              </div>
            ) : (
              <Button 
                onClick={triggerSOS}
                variant="destructive"
                size="lg"
                className="w-full text-xl py-6"
              >
                <Heart className="mr-2" size={24} />
                EMERGENCY SOS
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Core Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Hazard Detection */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warning size={20} className="text-accent" />
                Hazard Detection
              </CardTitle>
              <CardDescription>
                Real-time environmental sound monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <Badge variant={isListening ? "default" : "secondary"}>
                  {isListening ? "Active" : "Inactive"}
                </Badge>
              </div>
              {lastAlert && (
                <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-sm font-medium text-accent-foreground">Last Alert:</p>
                  <p className="text-sm">{lastAlert}</p>
                </div>
              )}
              <Button 
                onClick={toggleHazardMonitoring}
                variant={isListening ? "secondary" : "default"}
                className="w-full"
              >
                {isListening ? "Stop Monitoring" : "Start Monitoring"}
              </Button>
            </CardContent>
          </Card>

          {/* Communication Bridge */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={20} className="text-primary" />
                Communication
              </CardTitle>
              <CardDescription>
                Speech-to-text and sign language support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  <Ear className="mr-1" size={16} />
                  Speech-to-Text
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="mr-1" size={16} />
                  Sign Language
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Real-time communication assistance coming soon
              </p>
              <Button className="w-full" disabled>
                Open Communication Tools
              </Button>
            </CardContent>
          </Card>

          {/* Emergency Contacts */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} className="text-primary" />
                Emergency Contacts
              </CardTitle>
              <CardDescription>
                Trusted contacts for emergency situations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {userProfile.emergencyContacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No contacts added</p>
                ) : (
                  userProfile.emergencyContacts.slice(0, 2).map(contact => (
                    <div key={contact.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm font-medium">{contact.name}</span>
                      <Badge variant="outline">{contact.relationship}</Badge>
                    </div>
                  ))
                )}
              </div>
              <Button variant="outline" className="w-full">
                <Users className="mr-2" size={16} />
                Manage Contacts
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Settings Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings size={20} className="text-muted-foreground" />
              Settings & Preferences
            </CardTitle>
            <CardDescription>
              Customize your Guardian-Agent experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Current Preferences:</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>• Haptic Feedback: {userProfile.preferences.hapticFeedback ? 'Enabled' : 'Disabled'}</div>
                  <div>• Visual Alerts: {userProfile.preferences.visualAlerts ? 'Enabled' : 'Disabled'}</div>
                  <div>• Auto SOS: {userProfile.preferences.autoSOS ? 'Enabled' : 'Disabled'}</div>
                  <div>• SOS Countdown: {userProfile.preferences.sosCountdown} seconds</div>
                </div>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  <Settings className="mr-2" size={16} />
                  Open Settings
                </Button>
                <Button variant="outline" className="w-full">
                  <Phone className="mr-2" size={16} />
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attribution Footer */}
        <div className="text-center text-sm text-muted-foreground border-t pt-6">
          <p>Guardian-Agent 1 - Open Source AI4Good Project</p>
          <p>Owner: Fahed Mlaiel | Contact: mlaiel@live.de</p>
          <p>"Attribution to Fahed Mlaiel is mandatory in all copies, forks, and derivatives."</p>
        </div>
      </div>

      {/* Emergency Alert Dialog */}
      <AlertDialog open={emergencyMode}>
        <AlertDialogContent className="border-destructive">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive text-center">
              🚨 EMERGENCY MODE ACTIVE
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Emergency services will be contacted in {sosCountdown} seconds.
              <br />
              Press Cancel if this is a false alarm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Progress 
              value={(userProfile.preferences.sosCountdown - sosCountdown) / userProfile.preferences.sosCountdown * 100} 
              className="w-full"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={cancelSOS}
              variant="outline"
              className="w-full"
            >
              Cancel Emergency
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default App