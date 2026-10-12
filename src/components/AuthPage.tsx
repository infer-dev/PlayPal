'use client';

import { useState, type FormEvent } from 'react';
import { ArrowLeft, ShieldCheck, Sun, UserRound, Users } from 'lucide-react';

type Audience = 'parent' | 'child';
type ChildProfile = { displayName: string; ageBand: string; pin: string };
const inputStyle = { display: 'block', boxSizing: 'border-box' as const, width: '100%', marginTop: 7, padding: 12, borderRadius: 10, border: '1px solid #e3e8e1', background: '#fff', color: '#292d2b', fontFamily: 'Arial, system-ui, sans-serif' } as const;

export default function AuthPage({ initialMode, onBack, onDemo }: { initialMode: 'login' | 'signup'; onBack: () => void; onDemo: (audience: Audience) => void }) {
  const [mode, setMode] = useState(initialMode);
  const [audience, setAudience] = useState<Audience>('parent');
  const [parentName, setParentName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [children, setChildren] = useState<ChildProfile[]>([{ displayName: '', ageBand: '6–8', pin: '' }]);
  const [familyCode, setFamilyCode] = useState('');
  const [childName, setChildName] = useState('');
  const [childPin, setChildPin] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const signup = mode === 'signup';

  function validate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (audience === 'child') {
      if (!familyCode.trim() || !childName.trim() || !/^\d{4,6}$/.test(childPin)) {
        setError('Enter your family code, your nickname, and the 4–6 digit PIN your parent set up.');
        return;
      }
      setSubmitted(true);
      return;
    }
    if (signup) {
      if (parentName.trim().length < 2) return setError('Enter the name you’d like your family to see.');
      if (relationship === 'Other guardian') return setError('A parent or legal guardian must create and authorize child profiles. Please contact their guardian.');
      if (!guardianConsent) return setError('Please confirm that you are the child’s parent or authorized legal guardian.');
      if (children.some((child) => !child.displayName.trim() || !/^\d{4,6}$/.test(child.pin))) return setError('Add each child’s display name and a parent-set 4–6 digit sign-in PIN.');
      if (password.length < 8) return setError('Use a password with at least 8 characters.');
      if (password !== confirm) return setError('The passwords do not match.');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid parent email address.');
    if (!signup && password.length < 8) return setError('Enter your password (at least 8 characters).');
    setSubmitted(true);
  }

  function updateChild(index: number, key: keyof ChildProfile, value: string) {
    setChildren(children.map((child, i) => i === index ? { ...child, [key]: value } : child));
  }

  return <div style={{ minHeight: 'calc(100vh - 140px)', display: 'grid', placeItems: 'center', padding: '24px 0', fontFamily: 'Arial, system-ui, sans-serif' }}>
    <div className="card" style={{ width: 'min(520px, 100%)', boxSizing: 'border-box', padding: 27, background: '#fff', border: '1px solid #efeee9', borderRadius: 18, boxShadow: '0 3px 14px #242c2410' }}>
      <button onClick={onBack} style={{ border: 0, background: 'none', color: '#17633d', fontSize: 12, fontWeight: 700, padding: 0 }}><ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Back to PlayPal</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 19 }}><span style={{ width: 32, height: 32, borderRadius: 10, background: '#17633d', color: '#fff', display: 'grid', placeItems: 'center' }}><Sun size={18} /></span><span className="brand" style={{ fontSize: 21, color: '#17633d' }}>playpal<span style={{ color: '#159eaa' }}>.</span></span></div>
      <h1 style={{ fontFamily: 'Nunito', fontSize: 27, margin: '13px 0 5px' }}>{submitted ? 'All set for the demo' : signup ? 'Create your family account' : 'Welcome back'}</h1>
      <p style={{ color: '#788078', fontSize: 13, margin: '0 0 17px', lineHeight: 1.55 }}>{submitted ? 'This form was checked in your browser. No account or child profile was saved.' : 'Choose who is signing in. Children join through a parent-created profile.'}</p>
      {!submitted ? <>
        <div role="tablist" aria-label="Account type" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 5, background: '#f4f6f2', borderRadius: 12 }}>
          {(['parent', 'child'] as const).map((type) => <button key={type} role="tab" aria-selected={audience === type} onClick={() => { setAudience(type); setError(''); }} style={{ border: 0, borderRadius: 9, background: audience === type ? '#fff' : 'transparent', color: audience === type ? '#17633d' : '#727a72', padding: 10, fontSize: 12, fontWeight: 800, boxShadow: audience === type ? '0 1px 4px #182a1814' : 'none' }}>{type === 'parent' ? <><Users size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Parent / guardian</> : <><UserRound size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Child</>}</button>)}
        </div>
        {audience === 'child' && <div style={{ marginTop: 13, padding: 11, borderRadius: 10, background: '#eff5eb', color: '#5c7257', fontSize: 11, lineHeight: 1.5 }}><ShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />A parent creates your profile and gives you the family code and PIN. You don’t need an email address or phone number.</div>}
        <form onSubmit={validate} noValidate>
          {audience === 'parent' ? <>
            {signup && <>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginTop: 16 }}>Your display name<input autoComplete="name" value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Name your family knows you by" style={inputStyle} /></label>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginTop: 13 }}>Relationship to the child<select value={relationship} onChange={(e) => setRelationship(e.target.value)} style={inputStyle}><option>Parent</option><option>Legal guardian</option><option>Other guardian</option></select></label>
            </>}
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginTop: 14 }}>Parent email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} /></label>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginTop: 13 }}>Password<input type="password" autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" style={inputStyle} /></label>
            {signup && <>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginTop: 13 }}>Confirm password<input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Enter the same password again" style={inputStyle} /></label>
              <div style={{ marginTop: 19, fontSize: 12, fontWeight: 800 }}>Child profiles</div>
              <p style={{ fontSize: 11, color: '#7c837c', lineHeight: 1.5, margin: '4px 0 8px' }}>Use a nickname and broad age band. No exact birth date, address, child email, or phone is needed.</p>
              {children.map((child, index) => <div key={index} style={{ padding: 12, marginTop: 8, border: '1px solid #edf0ea', borderRadius: 12, background: '#fcfcfa' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#6a756a', marginBottom: 8 }}>CHILD {index + 1}</div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700 }}>Display name / nickname<input value={child.displayName} onChange={(e) => updateChild(index, 'displayName', e.target.value)} placeholder="e.g. Avi" style={{ ...inputStyle, marginTop: 5, padding: 10 }} /></label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 9 }}>
                  <label style={{ fontSize: 11, fontWeight: 700 }}>Age band<select value={child.ageBand} onChange={(e) => updateChild(index, 'ageBand', e.target.value)} style={{ ...inputStyle, marginTop: 5, padding: 10 }}><option>Under 6</option><option>6–8</option><option>9–12</option><option>13–17</option></select></label>
                  <label style={{ fontSize: 11, fontWeight: 700 }}>Parent-set PIN<input inputMode="numeric" maxLength={6} value={child.pin} onChange={(e) => updateChild(index, 'pin', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="4–6 digits" style={{ ...inputStyle, marginTop: 5, padding: 10 }} /></label>
                </div>
                {index > 0 && <button type="button" onClick={() => setChildren(children.filter((_, i) => i !== index))} style={{ border: 0, background: 'none', color: '#9b5e50', fontSize: 11, padding: '9px 0 0' }}>Remove this child</button>}
              </div>)}
              <button type="button" onClick={() => setChildren([...children, { displayName: '', ageBand: '6–8', pin: '' }])} style={{ border: 0, background: 'none', color: '#17633d', fontWeight: 800, fontSize: 11, padding: '10px 0' }}>+ Add another child</button>
              <label style={{ display: 'flex', gap: 9, alignItems: 'start', fontSize: 11, lineHeight: 1.5, color: '#626b62', marginTop: 9 }}><input type="checkbox" checked={guardianConsent} onChange={(e) => setGuardianConsent(e.target.checked)} style={{ marginTop: 2 }} />I confirm I am a parent or authorized legal guardian and consent to create these child profiles.</label>
            </>}
          </> : <>
            {signup ? <div style={{ marginTop: 16, padding: 13, borderRadius: 10, background: '#fff7e8', fontSize: 12, color: '#766a50', lineHeight: 1.55 }}>A child cannot create an independent account. Ask your parent or guardian to create your PlayPal profile and set your family code and PIN.</div> : <>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginTop: 16 }}>Family code<input autoComplete="off" value={familyCode} onChange={(e) => setFamilyCode(e.target.value)} placeholder="Code from your parent" style={inputStyle} /></label>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginTop: 13 }}>Your nickname<input autoComplete="username" value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="The name your parent added" style={inputStyle} /></label>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginTop: 13 }}>Your PIN<input inputMode="numeric" autoComplete="current-password" maxLength={6} value={childPin} onChange={(e) => setChildPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="4–6 digits from your parent" style={inputStyle} /></label>
            </>}
          </>}
          {error && <div role="alert" style={{ marginTop: 13, padding: 10, borderRadius: 9, background: '#fff0ec', color: '#a34f3d', fontSize: 12 }}>{error}</div>}
          {!(signup && audience === 'child') && <button className="btn-primary" type="submit" style={{ width: '100%', marginTop: 17, background: '#17633d', color: '#fff', border: 0, borderRadius: 11, padding: '12px 17px', fontWeight: 700 }}>{signup ? 'Review family details' : 'Continue'}</button>}
        </form>
        {!(signup && audience === 'child') && <button className="btn-soft" style={{ width: '100%', marginTop: 9, background: '#eef5ef', color: '#17633d', border: 0, borderRadius: 10, padding: '10px 13px', fontWeight: 700 }} onClick={() => onDemo(audience)}>Continue with demo account</button>}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#858c85', marginTop: 16 }}>{signup ? 'Already have an account?' : 'New to PlayPal?'} <button onClick={() => { setMode(signup ? 'login' : 'signup'); setError(''); setSubmitted(false); }} style={{ border: 0, background: 'none', color: '#17633d', fontWeight: 800 }}>{signup ? 'Log in' : 'Create account'}</button>{!signup && audience === 'parent' && <> · <button onClick={() => setError('Password recovery needs configured Supabase Auth. No email was sent.')} style={{ border: 0, background: 'none', color: '#17633d', fontWeight: 700 }}>Forgot password?</button></>}</div>
        <div style={{ fontSize: 10, color: '#8b7955', background: '#fff8e8', padding: 10, borderRadius: 9, marginTop: 16, lineHeight: 1.5 }}>Demo only. Forms validate in your browser but do not create accounts or transmit personal information. Supabase Auth is not configured.</div>
      </> : <>
        <div style={{ padding: 14, background: '#f4f7f1', borderRadius: 12, color: '#52694f', fontSize: 13, lineHeight: 1.65 }}>{audience === 'child' ? 'Your details look ready. In a real PlayPal account, your parent manages your profile and permissions.' : `${children.length} child profile${children.length === 1 ? '' : 's'} included. In a real account, profiles and approvals are saved securely with Supabase.`}</div>
        <button className="btn-primary" onClick={() => setSubmitted(false)} style={{ marginTop: 15, marginRight: 8 }}>Edit details</button>
        <button className="btn-soft" onClick={() => onDemo(audience)} style={{ marginTop: 15 }}>Explore the sample app</button>
      </>}
    </div>
  </div>;
}
