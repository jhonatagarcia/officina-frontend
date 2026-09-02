import { expect, test } from '@playwright/test';
import { interceptApi } from './fixtures/api';

test('modal de login no celular mantém o botão de fechar visível e acionável', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await interceptApi(page, '/auth/signup/config', {
    publicRegistrationEnabled: false,
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Fazer Login' }).click();

  const dialog = page.getByRole('dialog', { name: 'Login' });
  const closeButton = page.getByRole('button', { name: 'Fechar' });

  await expect(dialog).toBeVisible();
  await expect(closeButton).toBeVisible();

  const box = await closeButton.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  expect(box!.x).toBeGreaterThanOrEqual(320);
  expect(box!.y).toBeLessThanOrEqual(24);

  await closeButton.click();
  await expect(dialog).toBeHidden();
});
