import { test, expect } from '@playwright/test';
import { navigateToRepositories } from './helpers/navHelpers';
import { closePopupsIfExist } from './helpers/helpers';
import { deleteAllPopularRepos } from './helpers/deletePopularRepositories';

test.describe('Popular Repositories', () => {
  test('Add popular repos', async ({ page }) => {
    // Ensure no popular repos are selected.
    await deleteAllPopularRepos(page);

    await navigateToRepositories(page);
    await closePopupsIfExist(page);
    await expect(page).toHaveTitle('Repositories - Content | RHEL');

    await test.step('Select the Popular repos tab', async () => {
      await page.getByRole('link', { name: 'Popular repositories' }).click();
      await expect(page.getByTestId('popular_repos_table')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Add selected repositories' })).toBeVisible();
    });

    await test.step('Select EPEL 9', async () => {
      await page
        .getByRole('row', { name: 'EPEL 9 Everything x86_64' })
        .getByLabel('Select row 0', { exact: true })
        .click();
      await page.getByTestId('add-selected-dropdown-toggle-no-snap');
      await page.getByRole('menuitem', { name: 'Add 1 repositories without snapshotting' });
    });

    await test.step('Select EPEL 8 and add both repos', async () => {
      await page
        .getByRole('row', { name: 'EPEL 8 Everything x86_64' })
        .getByLabel('Select row 1', { exact: true })
        .click();
      await page.getByTestId('add-selected-dropdown-toggle-no-snap').click();
      await page.getByRole('menuitem', { name: 'Add 2 repositories without snapshotting' }).click();
    });

    await test.step('Check buttons have changed from Add to Remove', async () => {
      await expect(
        page
          .getByRole('row', { name: 'EPEL 8 Everything x86_64' })
          .getByTestId('remove_popular_repo')
          .getByText('Remove'),
      ).toBeVisible();
      await expect(
        page
          .getByRole('row', { name: 'EPEL 9 Everything x86_64' })
          .getByTestId('remove_popular_repo')
          .getByText('Remove'),
      ).toBeVisible();
    });

    await test.step('Move to Custom repo tab', async () => { 
      await page.getByRole('link', { name: 'Your repositories' }).click();
      await expect(page.getByTestId('custom_repositories_table')).toBeVisible();
    });

    await test.step('Use kebab menu to delete a repo', async () => {
      await page.getByRole('textbox', { name: 'Filter by name/url' }).fill('EPEL');
      await page.getByRole('checkbox', { name: 'Select row 0' }).check();

      await page.getByTestId('custom_repositories_kebab_toggle').click();
      await page.getByRole('menuitem', { name: 'Remove 1 repositories' }).click();
      // Confirm the removal in the pop-up
      await page.getByRole('button', { name: 'Remove' }).click();
    });

    await test.step('Use kebab menu to delete a repo', async () => {
      await page.getByRole('textbox', { name: 'Filter by name/url' }).fill('EPEL');
      await page.getByRole('checkbox', { name: 'Select row 0' }).check();
      await page.getByTestId('custom_repositories_kebab_toggle').click();
      await page.getByRole('menuitem', { name: 'Remove 1 repositories' }).click();
      // Confirm the removal in the pop-up
      await page.getByRole('button', { name: 'Remove' }).click();
    });
  });
});
