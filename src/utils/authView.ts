// utils/authView.ts
export const getInitialAuthView = (search: string): 'sign_in' | 'sign_up' => {
  const view = new URLSearchParams(search).get('view');
  return view === 'sign_up' ? 'sign_up' : 'sign_in';
};