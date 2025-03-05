import { test, expect } from '@playwright/test';
import { navigateToRepositories } from './helpers/navHelpers';
import { deleteAllRepos } from './helpers/deleteRepositories';
import { closePopupsIfExist, getRowByName, validateSnapshotTimestamp } from './helpers/helpers';

test.describe('Snapshot Repositories', () => {
  test('Snapshot a repository', async ({ page }) => {
    await navigateToRepositories(page);
    await closePopupsIfExist(page);

    const repoName = 'one';

    await test.step('Cleanup repository, if using the same url', async () => {
      await deleteAllRepos(
        page,
        `&url=https://jlsherrill.fedorapeople.org/fake-repos/revision/` + repoName,
      );
    });

    await test.step('Open the add repository modal', async () => {
      await page.getByRole('button', { name: 'Add repositories' }).first().click();
      await expect(page.getByText('Add custom repositories')).toBeVisible();
    });

    await test.step('Select snapshotting', async () => {
      await page.getByRole('radio', { name: 'Snapshotting' }).first().click();
    });

    await test.step('Fill in the repository details', async () => {
      await page.getByLabel('Name').fill(repoName);
      await page
        .getByLabel('URL')
        .fill('https://jlsherrill.fedorapeople.org/fake-repos/revision/' + repoName);
    });

    await test.step('Filter by architecture', async () => {
      await page.getByRole('button', { name: 'filter architecture' }).click();
      await page.getByRole('option', { name: 'x86_64' }).click();
    });

    await test.step('Filter by version', async () => {
      const versionFilterButton = page.getByRole('button', { name: 'filter version' });
      await versionFilterButton.click();
      await page.getByRole('menuitem', { name: 'el9' }).locator('label').click();
      await page.getByRole('menuitem', { name: 'el8' }).locator('label').click();
      await versionFilterButton.click(); // Close the version filter dropdown
    });

    await test.step('Wait for the successful API call', async () => {
      if (await page.locator('.pf-v5-c-helper-text__item.pf-m-error').isVisible()) {
        throw new Error('Error message in element is visible');
      }
    });

    await test.step('Submit the form and wait for modal to disappear', async () => {
      await Promise.all([
        // Click on 'Save'
        page.getByRole('button', { name: 'Save' }).first().click(),
        page.waitForResponse(
          (resp) =>
            resp.url().includes('/bulk_create/') && resp.status() >= 200 && resp.status() < 300,
        ),
        expect(page.locator('div[id^="pf-modal-part"]').first()).not.toBeVisible(),
      ]);
    });

    await test.step('Verify that snapshot is successful', async () => {
      await expect(page.getByText('Valid')).toBeVisible({ timeout: 60000 });
    });

    await test.step('Verify that snapshot is in snapshots list', async () => {
      await page.getByRole('button', { name: 'Kebab toggle' }).first().click();
      await page.getByRole('menuitem', { name: 'View all snapshots' }).click();
      await expect(page.getByLabel('SnapshotsView list of').locator('tbody')).toBeVisible();
      const snapshotTimestamp = await page
        .getByLabel('SnapshotsView list of')
        .locator('tbody')
        .textContent();
      if (snapshotTimestamp != null) {
        if ((await validateSnapshotTimestamp(snapshotTimestamp, 10)) == false) {
          throw new Error('Most recent snapshot timestamp is older than 10 minutes!');
        }
      } else {
        throw new Error('Snapshot timestamp not found!');
      }
      await page.getByLabel('Close', { exact: true }).click();
    });

    await test.step('Delete created repository', async () => {
      const row = await getRowByName(page, repoName);
      await row.getByLabel('Kebab toggle').click();
      await row.getByRole('menuitem', { name: 'Delete' }).click();
      await expect(page.getByText('Remove repositories?')).toBeVisible();

      await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes('bulk_delete') && resp.status() >= 200 && resp.status() < 300,
        ),
        page.getByRole('button', { name: 'Remove' }).click(),
      ]);

      await expect(
        page.getByText('No custom repositories match the filter criteria'),
      ).toBeVisible();
    });
  });
});
