import { test, expect } from '@playwright/test';

test.describe('End-to-End Real-Time Multi-Session Flow (Interviewer / Candidate)', () => {
  test('Two concurrent clients: Host creates session, shares link, Candidate joins and changes state, Host sees real-time update', async ({
    browser,
  }) => {
    // =========================================================================
    // Step 1: Log in as the interviewer (Session 1)
    // =========================================================================
    const interviewerContext = await browser.newContext();
    const interviewerPage = await interviewerContext.newPage();

    await interviewerPage.goto('/?view=host');

    // Confirm Host / Interviewer dashboard is loaded
    await expect(interviewerPage.getByText('MaitreQ', { exact: true })).toBeVisible();
    await expect(interviewerPage.getByRole('heading', { name: /Dining Floor/i })).toBeVisible();
    const addPartyBtn = interviewerPage.getByRole('button', { name: /Add Party/i });
    await expect(addPartyBtn).toBeVisible();

    // =========================================================================
    // Step 2: Create an interview session / party
    // =========================================================================
    const uniqueId = Date.now().toString().slice(-4);
    const candidateName = `Candidate Taylor ${uniqueId}`;
    const candidatePhone = `+1 (555) 789-${uniqueId}`;

    await addPartyBtn.click();

    // Fill the registration modal
    await expect(interviewerPage.getByText('Add Party to Waitlist')).toBeVisible();
    await interviewerPage.getByPlaceholder('e.g. Jessica Miller').fill(candidateName);
    await interviewerPage.getByPlaceholder('e.g. +1 (555) 019-2834').fill(candidatePhone);
    await interviewerPage.getByRole('button', { name: /Add to Queue/i }).click();

    // Confirm the candidate party card appears in the Interviewer's active list
    const candidateHeading = interviewerPage.getByRole('heading', { name: candidateName });
    await expect(candidateHeading).toBeVisible({ timeout: 10000 });

    // =========================================================================
    // Step 3: Share the join link
    // =========================================================================
    // Locate the party card container and open the Guest Link & QR modal
    const partyCard = interviewerPage.locator('div.rounded-xl', { has: candidateHeading });
    const qrBtn = partyCard.getByTitle('Guest Status Link & QR');
    await qrBtn.click();

    await expect(interviewerPage.getByText('Guest Live Tracking Link')).toBeVisible();

    // Extract the generated public join link
    const openStatusLink = interviewerPage.getByRole('link', { name: /Open Status/i });
    const joinUrl = await openStatusLink.getAttribute('href');
    expect(joinUrl).toBeTruthy();

    // Close the share modal in Session 1
    await interviewerPage.getByRole('button', { name: 'Close' }).click();

    // =========================================================================
    // Step 4: Join from a separate client as the candidate (Session 2)
    // =========================================================================
    const candidateContext = await browser.newContext();
    const candidatePage = await candidateContext.newPage();

    // Navigate to the shared join link in Session 2
    await candidatePage.goto(joinUrl!);

    // Verify candidate portal mounts with candidate's details
    await expect(candidatePage.locator('main').getByText(candidateName)).toBeVisible({ timeout: 10000 });
    await expect(candidatePage.locator('main').getByText('Position in Line')).toBeVisible();
    await expect(candidatePage.locator('main').getByText('Waiting', { exact: true })).toBeVisible();

    // =========================================================================
    // Step 5: Change the canvas / state as the candidate (Session 2)
    // =========================================================================
    // Candidate triggers self-cancellation from the portal
    const leaveButton = candidatePage.getByRole('button', { name: /Plans changed\? Leave waitlist/i });
    await expect(leaveButton).toBeVisible();
    await leaveButton.click();

    // Confirm in modal
    await expect(candidatePage.getByText('Leave the Waitlist?')).toBeVisible();
    await candidatePage.getByRole('button', { name: /Yes, Leave Waitlist/i }).click();

    // Verify candidate session updates to Cancelled state
    await expect(candidatePage.getByRole('heading', { name: 'Waitlist Cancelled' }).first()).toBeVisible({ timeout: 10000 });

    // =========================================================================
    // Step 6: Verify that the interviewer sees the change (Session 1)
    // =========================================================================
    // Session 1 (Interviewer) receives the Server-Sent Event (SSE) in real-time without manual refresh
    await expect(
      interviewerPage.getByText(`${candidateName} cancelled their spot.`)
    ).toBeVisible({ timeout: 10000 });

    // Clean up browser contexts
    await candidateContext.close();
    await interviewerContext.close();
  });
});
