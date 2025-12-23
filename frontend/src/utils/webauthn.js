import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

export const registerWithPasskey = async (email, name, getOptions, verifyCredential) => {
  const optionsResponse = await getOptions({ email, name });
  const options = optionsResponse.data.data.options;

  const credential = await startRegistration(options);

  const verifyResponse = await verifyCredential({
    email,
    name,
    credential
  });

  return verifyResponse.data.data;
};

export const loginWithPasskey = async (email, getOptions, verifyCredential) => {
  const optionsResponse = await getOptions({ email });
  const options = optionsResponse.data.data.options;

  const credential = await startAuthentication(options);

  const verifyResponse = await verifyCredential({
    email,
    credential
  });

  return verifyResponse.data.data;
};
