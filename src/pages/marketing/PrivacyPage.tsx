import { Link } from 'react-router-dom'

import { SITE_NAME } from '../../config/site'
import './LegalPage.css'

const LAST_UPDATED = 'June 26, 2026'
const CONTACT_EMAIL = 'hello@trackpepper.com'

export function PrivacyPage() {
  return (
    <article className="legal-page">
      <div className="legal-page-inner">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: {LAST_UPDATED}</p>

        <div className="legal-prose">
          <p>
            This Privacy Policy describes how {SITE_NAME} (&ldquo;we,&rdquo; &ldquo;us&rdquo;)
            collects, uses, and shares information when you use our website and mobile
            applications (the &ldquo;Service&rdquo;).
          </p>

          <h2>1. Information we collect</h2>
          <p>We collect information you provide directly, including:</p>
          <ul>
            <li>Account information (email address, display name, password)</li>
            <li>Household information (household name, invite codes, member profiles)</li>
            <li>Pet information (name, species, date of birth)</li>
            <li>Schedule data (tasks, completion records, and related activity)</li>
          </ul>
          <p>
            We also collect technical and usage information automatically, such as device
            type, browser, pages viewed, and interactions with the Service, through analytics
            tools described below.
          </p>

          <h2>2. How we use information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide, maintain, and improve the Service</li>
            <li>Authenticate you and sync data across your household&apos;s devices</li>
            <li>Understand how the Service is used so we can fix issues and improve features</li>
            <li>Respond to support requests and protect the security of the Service</li>
          </ul>

          <h2>3. How we share information</h2>
          <p>
            <strong>Within your household.</strong> Pet schedules, tasks, and completion
            status are visible to members of your household who have joined with your invite
            code.
          </p>
          <p>
            <strong>Service providers.</strong> We use third-party services to operate the
            Service, including:
          </p>
          <ul>
            <li>
              <strong>Supabase</strong> — authentication, database, and real-time sync
            </li>
            <li>
              <strong>Google Analytics</strong> — website usage analytics
            </li>
            <li>
              <strong>Firebase Analytics</strong> — mobile app usage analytics
            </li>
            <li>
              <strong>Netlify</strong> — website hosting
            </li>
          </ul>
          <p>
            These providers process data on our behalf according to their own privacy policies
            and our agreements with them.
          </p>
          <p>
            We do not sell your personal information.
          </p>

          <h2>4. Analytics</h2>
          <p>
            We use Google Analytics on the web and Firebase Analytics in our mobile app to
            understand usage patterns (for example, which screens are visited and when tasks
            are completed). When you are signed in, we may associate analytics events with
            your user ID and household status to improve the product. You can learn more
            about Google&apos;s practices at{' '}
            <a href="https://policies.google.com/privacy" rel="noopener noreferrer" target="_blank">
              policies.google.com/privacy
            </a>
            .
          </p>

          <h2>5. Affiliate links</h2>
          <p>
            Some pages include product recommendations with affiliate links (for example, to
            Amazon). Those sites may collect information under their own policies if you click
            through. We do not receive your payment or account information from those purchases.
          </p>

          <h2>6. Data retention</h2>
          <p>
            We retain your information for as long as your account is active or as needed to
            provide the Service. If you delete your account or request deletion, we will
            delete or anonymize your data within a reasonable period, except where retention
            is required by law.
          </p>

          <h2>7. Security</h2>
          <p>
            We use industry-standard measures to protect your data, including encrypted
            connections and access controls. No method of transmission or storage is 100%
            secure, and we cannot guarantee absolute security.
          </p>

          <h2>8. Children</h2>
          <p>
            The Service is intended for use by household members managing pet care. Accounts
            should be created by adults. We do not knowingly collect personal information
            from children under 13 without parental consent.
          </p>

          <h2>9. Your choices</h2>
          <p>
            You may update your profile and pet information in Settings. You may sign out or
            stop using the Service at any time. To request access to or deletion of your data,
            contact us using the information below.
          </p>

          <h2>10. Changes</h2>
          <p>
            We may update this Privacy Policy from time to time. We will post the revised
            policy on this page and update the &ldquo;Last updated&rdquo; date.
          </p>

          <h2>11. Contact</h2>
          <p>
            Questions about this Privacy Policy? Email us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. See also our{' '}
            <Link to="/terms">Terms of Service</Link>.
          </p>
        </div>
      </div>
    </article>
  )
}
