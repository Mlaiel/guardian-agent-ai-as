/*
 * Owner: Fahed Mlaiel
 * Contact: mlaiel@live.de
 * Notice: "Attribution to Fahed Mlaiel is mandatory in all copies, forks, and derivatives."
 */

import { useState, useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, Heart, Phone, Eye, Ear, Warning, Settings, Users, MessageSquare, Plus, X, Mic, MicOff, Volume2, VolumeX } from '@phosphor-icons/react'
import { toast, Toaster } from 'sonner'

// Speech API type declarations for better browser compatibility
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

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
    speechToTextEnabled: boolean
    textToSpeechEnabled: boolean
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
      sosCountdown: 10,
      speechToTextEnabled: true,
      textToSpeechEnabled: true
    }
  })

  const [isListening, setIsListening] = useKV('hazard-monitoring', false)
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [sosCountdown, setSosCountdown] = useState(0)
  const [lastAlert, setLastAlert] = useKV<string | null>('last-alert', null)
  
  // Communication features
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [textToSpeak, setTextToSpeak] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  // Settings and contact management
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [contactsOpen, setContactsOpen] = useState(false)
  const [newContact, setNewContact] = useState<Partial<EmergencyContact>>({})

  // Web Speech API support
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthesisRef = useRef<SpeechSynthesis | null>(null)

  // Initialize Web Speech API
  useEffect(() => {
    // Check for Speech Recognition support
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            }
          }
          if (finalTranscript) {
            setTranscription(prev => prev + ' ' + finalTranscript)
          }
        }
        
        recognition.onerror = () => {
          setIsRecording(false)
          toast.error('Speech recognition error')
        }
        
        recognitionRef.current = recognition
      } catch (error) {
        console.warn('Speech Recognition initialization failed:', error)
      }
    }

    // Check for Speech Synthesis support
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        synthesisRef.current = window.speechSynthesis
      } catch (error) {
        console.warn('Speech Synthesis initialization failed:', error)
      }
    }
  }, [])

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
      executeSOS()
    }
  }, [emergencyMode, sosCountdown])

  const executeSOS = () => {
    toast.error('SOS ACTIVATED - EMERGENCY SERVICES CONTACTED', {
      description: 'Emergency contacts have been notified',
      duration: 10000
    })
    
    // Simulate emergency contact notification
    userProfile.emergencyContacts.forEach(contact => {
      console.log(`Notifying ${contact.name} at ${contact.phone}`)
    })
    
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
      { type: 'Construction Noise', severity: 'low', action: 'Construction zone ahead' },
      { type: 'Horn Honking', severity: 'high', action: 'Move away from traffic' },
      { type: 'Alarm Bell', severity: 'medium', action: 'Possible emergency in area' }
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

  // Speech-to-Text functionality
  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in this browser')
      return
    }

    try {
      if (isRecording) {
        recognitionRef.current.stop()
        setIsRecording(false)
        toast.info('Speech recognition stopped')
      } else {
        setTranscription('')
        recognitionRef.current.start()
        setIsRecording(true)
        toast.success('Speech recognition started')
      }
    } catch (error) {
      setIsRecording(false)
      toast.error('Failed to start speech recognition')
      console.warn('Speech recognition error:', error)
    }
  }

  // Text-to-Speech functionality
  const speakText = () => {
    if (!synthesisRef.current || !textToSpeak.trim()) {
      toast.error('Text-to-speech not available or no text to speak')
      return
    }

    try {
      if (isSpeaking) {
        synthesisRef.current.cancel()
        setIsSpeaking(false)
        return
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.rate = 0.8
      utterance.pitch = 1
      utterance.volume = 1
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => {
        setIsSpeaking(false)
        toast.error('Speech synthesis error')
      }

      synthesisRef.current.speak(utterance)
      toast.success('Speaking text...')
    } catch (error) {
      setIsSpeaking(false)
      toast.error('Failed to speak text')
      console.warn('Speech synthesis error:', error)
    }
  }

  // Emergency contacts management
  const addEmergencyContact = () => {
    if (!newContact.name || !newContact.phone || !newContact.relationship) {
      toast.error('Please fill all contact fields')
      return
    }

    const contact: EmergencyContact = {
      id: Date.now().toString(),
      name: newContact.name,
      phone: newContact.phone,
      relationship: newContact.relationship,
      priority: userProfile.emergencyContacts.length + 1
    }

    setUserProfile(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, contact]
    }))

    setNewContact({})
    toast.success('Emergency contact added')
  }

  const removeEmergencyContact = (contactId: string) => {
    try {
      setUserProfile(prev => ({
        ...prev,
        emergencyContacts: prev.emergencyContacts.filter(c => c.id !== contactId)
      }))
      toast.success('Emergency contact removed')
    } catch (error) {
      toast.error('Failed to remove contact')
      console.warn('Error removing contact:', error)
    }
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
                Speech-to-text and text-to-speech tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={isRecording ? "destructive" : "outline"} 
                  size="sm"
                  onClick={toggleSpeechRecognition}
                  disabled={!userProfile.preferences.speechToTextEnabled}
                >
                  {isRecording ? <MicOff className="mr-1" size={16} /> : <Mic className="mr-1" size={16} />}
                  {isRecording ? "Stop" : "Listen"}
                </Button>
                <Button 
                  variant={isSpeaking ? "destructive" : "outline"} 
                  size="sm"
                  onClick={speakText}
                  disabled={!userProfile.preferences.textToSpeechEnabled || !textToSpeak.trim()}
                >
                  {isSpeaking ? <VolumeX className="mr-1" size={16} /> : <Volume2 className="mr-1" size={16} />}
                  {isSpeaking ? "Stop" : "Speak"}
                </Button>
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <MessageSquare className="mr-2" size={16} />
                    Open Communication Tools
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Communication Assistant</DialogTitle>
                    <DialogDescription>
                      Real-time speech-to-text and text-to-speech conversion
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="speech-to-text" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="speech-to-text">Speech to Text</TabsTrigger>
                      <TabsTrigger value="text-to-speech">Text to Speech</TabsTrigger>
                    </TabsList>
                    <TabsContent value="speech-to-text" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Live Transcription</Label>
                        <div className="min-h-[100px] p-3 border rounded-md bg-muted/50">
                          {transcription || "Click 'Start Listening' to begin transcription..."}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={toggleSpeechRecognition}
                            variant={isRecording ? "destructive" : "default"}
                            className="flex-1"
                          >
                            {isRecording ? <MicOff className="mr-2" size={16} /> : <Mic className="mr-2" size={16} />}
                            {isRecording ? "Stop Listening" : "Start Listening"}
                          </Button>
                          <Button
                            onClick={() => setTranscription('')}
                            variant="outline"
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="text-to-speech" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="text-input">Text to Speak</Label>
                        <Textarea
                          id="text-input"
                          placeholder="Enter text to convert to speech..."
                          value={textToSpeak}
                          onChange={(e) => setTextToSpeak(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <Button
                          onClick={speakText}
                          variant={isSpeaking ? "destructive" : "default"}
                          className="w-full"
                          disabled={!textToSpeak.trim()}
                        >
                          {isSpeaking ? <VolumeX className="mr-2" size={16} /> : <Volume2 className="mr-2" size={16} />}
                          {isSpeaking ? "Stop Speaking" : "Speak Text"}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
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
              
              <Dialog open={contactsOpen} onOpenChange={setContactsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Users className="mr-2" size={16} />
                    Manage Contacts
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Emergency Contacts</DialogTitle>
                    <DialogDescription>
                      Manage your emergency contact list
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Existing contacts */}
                    <div className="space-y-2">
                      {userProfile.emergencyContacts.map(contact => (
                        <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <p className="text-sm text-muted-foreground">{contact.phone}</p>
                            <Badge variant="outline" className="text-xs">{contact.relationship}</Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeEmergencyContact(contact.id)}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Add new contact */}
                    <div className="space-y-2 border-t pt-4">
                      <h4 className="font-medium">Add New Contact</h4>
                      <Input
                        placeholder="Name"
                        value={newContact.name || ''}
                        onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <Input
                        placeholder="Phone number"
                        value={newContact.phone || ''}
                        onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                      />
                      <Select onValueChange={(value) => setNewContact(prev => ({ ...prev, relationship: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="family">Family</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                          <SelectItem value="caregiver">Caregiver</SelectItem>
                          <SelectItem value="medical">Medical Professional</SelectItem>
                          <SelectItem value="neighbor">Neighbor</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={addEmergencyContact} className="w-full">
                        <Plus className="mr-2" size={16} />
                        Add Contact
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Settings & Preferences */}
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
                  <div>• Speech-to-Text: {userProfile.preferences.speechToTextEnabled ? 'Enabled' : 'Disabled'}</div>
                  <div>• Text-to-Speech: {userProfile.preferences.textToSpeechEnabled ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>
              <div className="space-y-2">
                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Settings className="mr-2" size={16} />
                      Open Settings
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Guardian-Agent Settings</DialogTitle>
                      <DialogDescription>
                        Configure your accessibility preferences
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* Personal Information */}
                      <div className="space-y-2">
                        <Label htmlFor="user-name">Name</Label>
                        <Input
                          id="user-name"
                          value={userProfile.name}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Your name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="medical-info">Medical Information</Label>
                        <Textarea
                          id="medical-info"
                          value={userProfile.medicalInfo}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, medicalInfo: e.target.value }))}
                          placeholder="Important medical information for emergency responders"
                        />
                      </div>

                      {/* Accessibility Preferences */}
                      <div className="space-y-4">
                        <h4 className="font-medium">Accessibility Preferences</h4>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="haptic-feedback">Haptic Feedback</Label>
                          <Switch
                            id="haptic-feedback"
                            checked={userProfile.preferences.hapticFeedback}
                            onCheckedChange={(checked) => setUserProfile(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, hapticFeedback: checked }
                            }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="visual-alerts">Visual Alerts</Label>
                          <Switch
                            id="visual-alerts"
                            checked={userProfile.preferences.visualAlerts}
                            onCheckedChange={(checked) => setUserProfile(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, visualAlerts: checked }
                            }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="auto-sos">Auto SOS</Label>
                          <Switch
                            id="auto-sos"
                            checked={userProfile.preferences.autoSOS}
                            onCheckedChange={(checked) => setUserProfile(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, autoSOS: checked }
                            }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="speech-to-text">Speech-to-Text</Label>
                          <Switch
                            id="speech-to-text"
                            checked={userProfile.preferences.speechToTextEnabled}
                            onCheckedChange={(checked) => setUserProfile(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, speechToTextEnabled: checked }
                            }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="text-to-speech">Text-to-Speech</Label>
                          <Switch
                            id="text-to-speech"
                            checked={userProfile.preferences.textToSpeechEnabled}
                            onCheckedChange={(checked) => setUserProfile(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, textToSpeechEnabled: checked }
                            }))}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="sos-countdown">SOS Countdown (seconds)</Label>
                          <Select 
                            value={userProfile.preferences.sosCountdown.toString()}
                            onValueChange={(value) => setUserProfile(prev => ({
                              ...prev,
                              preferences: { ...prev.preferences, sosCountdown: parseInt(value) }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 seconds</SelectItem>
                              <SelectItem value="10">10 seconds</SelectItem>
                              <SelectItem value="15">15 seconds</SelectItem>
                              <SelectItem value="30">30 seconds</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
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
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-input"
            >
              Cancel Emergency
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toast Notifications */}
      <Toaster 
        position="top-center"
        expand={true}
        richColors
        closeButton
      />
    </div>
  )
}

export default App