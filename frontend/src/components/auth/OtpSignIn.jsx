import { useState } from 'react';
import PhoneStep from './PhoneStep.jsx';
import OtpStep from './OtpStep.jsx';
import { useSendOtp, useVerifyOtp } from '../../queries/auth.query.js';
import { useToast } from '../../context/toast.context.js';

/**
 * Phone -> WhatsApp code -> session. Shared by the dashboard and admin sign-in
 * screens; `scope` tells the API which accounts this screen lets in.
 */
export default function OtpSignIn({ scope, title, note, onSignedIn }) {
  const toast = useToast();

  const [phone, setPhone] = useState('');
  const [resendAt, setResendAt] = useState(0); // 0 until a code has been sent

  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  const step = resendAt ? 'otp' : 'phone';

  const handleSend = (value) => {
    sendOtp.mutate(
      { phone: value, scope },
      {
        onSuccess: (data) => {
          setPhone(value);
          setResendAt(Date.now() + (data.resendAfterSeconds ?? 30) * 1000);
          verifyOtp.reset();
          toast.success('Code sent', `Check WhatsApp on +91 ${value}`);
          if (data.debugOtp) console.info('[dev] OTP:', data.debugOtp);
        },
      }
    );
  };

  const handleVerify = (otp) => {
    verifyOtp.mutate(
      { phone, otp, scope },
      {
        onSuccess: ({ user }) => {
          toast.success(`Welcome${user.name ? `, ${user.name.split(' ')[0]}` : ''}`);
          onSignedIn(user);
        },
      }
    );
  };

  const handleBack = () => {
    setResendAt(0);
    sendOtp.reset();
    verifyOtp.reset();
  };

  if (step === 'phone') {
    return (
      <PhoneStep
        title={title}
        note={note}
        defaultValue={phone}
        loading={sendOtp.isPending}
        error={sendOtp.error?.message}
        onSubmit={handleSend}
      />
    );
  }

  return (
    <OtpStep
      phone={phone}
      resendAt={resendAt}
      loading={verifyOtp.isPending}
      resending={sendOtp.isPending}
      error={verifyOtp.error?.message || sendOtp.error?.message}
      onVerify={handleVerify}
      onResend={() => handleSend(phone)}
      onBack={handleBack}
    />
  );
}
