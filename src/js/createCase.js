import Cookies from 'js-cookie';
import * as Sentry from '@sentry/browser';
import logger from './jwt/logger';
const log = logger('createCase.js');

import { getUrl } from './utils';

// Lit of products that are bundles
const BUNDLE_PRODUCTS = [
  { id: 'openshift', name: 'Red Hat OpenShift Cluster Manager' },
  { id: 'insights', name: 'Red Hat Insights' },
  { id: 'subscriptions', name: 'Subscription Watch' },
  { id: 'migrations', name: 'Migration Analytics' },
  { id: 'cost-management', name: 'Red Hat Cost Management' },
];

// List of products that are individual apps
const APP_PRODUCTS = [
  { id: 'automation-hub', name: 'Ansible Automation Hub' },
  { id: 'automation-analytics', name: 'Ansible Automation Analytics' },
];

function getLocation() {
  const currentLocation = {
    bundle: getUrl('bundle'),
    app: getUrl('app'),
  };

  return currentLocation;
}

function registerProduct() {
  const currentLocation = getLocation();

  const product =
    BUNDLE_PRODUCTS.find((bundle) => bundle.id === currentLocation.bundle) || APP_PRODUCTS.find((app) => app.id === currentLocation.app);

  return product?.name;
}

async function getProductHash() {
  const currentLocation = getLocation();

  const path = `${window.location.origin}${window.insights.chrome.isBeta() ? '/beta/' : '/'}apps/${currentLocation.app}/app.info.json`;

  const appData = currentLocation.app.length && (await (await fetch(path)).json());
  return appData ? `Current app: ${currentLocation.app}, Current app hash: ${appData.src_hash}` : `Unknown app, filed on ${window.location.href}`;
}

export async function createSupportCase(userInfo, fields) {
  const currentProduct = registerProduct() || 'Other';
  const currentHash = await getProductHash();

  log('Creating a support case');

  fetch(`https://access.${window.insights.chrome.isProd ? '' : 'qa.'}redhat.com/hydra/rest/se/sessions`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${Cookies.get('cs_jwt')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session: {
        createdBy: `${userInfo.user.username}`,
        userAgent: 'cloud.redhat.com',
      },
      sessionDetails: {
        createdBy: `${userInfo.user.username}`,
        environment: `Production${window.insights.chrome.isBeta() ? ' Beta' : ''}, ${currentHash}`,
        ...(currentProduct && { product: currentProduct }),
        ...fields?.caseFields,
      },
    }),
  })
    .then((response) => response.json())
    .then(
      (data) =>
        data &&
        // eslint-disable-next-line max-len
        window.open(
          `https://access.${window.insights.chrome.isProd ? '' : 'qa.'}redhat.com/support/cases/#/case/new/open-case/describe-issue?seSessionId=${
            data.session.id
          }`
        ) &&
        createSupportSentry(data.session.id, fields)
    )
    .catch((err) => Sentry.captureException(err));
}

function createSupportSentry(session, fields) {
  if (window.insights.chrome.isProd) {
    log('Capturing support case information in Sentry');
    // this should capture the app information anyway, so no need to pass extra data
    Sentry.captureException(new Error('Support case created'), {
      tags: {
        caseId: session,
        ...(fields && { additionalFields: fields }),
      },
    });
  } else {
    log('No Sentry info captured in non prod environments');
  }
}
