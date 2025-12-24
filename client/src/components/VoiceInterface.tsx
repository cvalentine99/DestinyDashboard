import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceInterfaceProps {
  onTranscription?: (text: string) => void;
  onResponse?: (response: string) => void;
}

export default function VoiceInterface({ onTranscription, onResponse }: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const { isAuthenticated } = useAuth();

  // Voice query mutation
  const voiceQueryMutation = trpc.voice.processQuery.useMutation({
    onSuccess: (data) => {
      setIsProcessing(false);
      if (data.transcription) {
        onTranscription?.(data.transcription);
      }
      if (data.response) {
        const responseText = typeof data.response === 'string' ? data.response : String(data.response);
        onResponse?.(responseText);
        // Speak the response
        speakResponse(responseText);
      }
    },
    onError: (error) => {
      setIsProcessing(false);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Voice processing failed: ${message}`);
    },
  });

  // Text-to-speech
  const speakResponse = (text: string) => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    
    // Try to use a female voice for Ghost
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes("Samantha") || 
      v.name.includes("Google UK English Female") ||
      v.name.includes("Microsoft Zira")
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  };

  // Start recording
  const startListening = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to use voice commands");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = (reader.result as string).split(",")[1];
          setIsProcessing(true);
          voiceQueryMutation.mutate({ audioData: base64Audio });
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          stopListening();
        }
      }, 10000);

    } catch (error) {
      toast.error("Microphone access denied");
    }
  };

  // Stop recording
  const stopListening = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleListening}
        disabled={isProcessing}
        className={`relative ${isListening ? "text-destructive" : "text-primary"}`}
      >
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isListening ? (
          <>
            <MicOff className="h-5 w-5" />
            <span className="absolute inset-0 animate-ping bg-destructive/20 rounded-full" />
          </>
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>

      {isSpeaking && (
        <Button
          variant="ghost"
          size="icon"
          onClick={stopSpeaking}
          className="text-secondary"
        >
          <Volume2 className="h-5 w-5 animate-pulse" />
        </Button>
      )}
    </div>
  );
}
