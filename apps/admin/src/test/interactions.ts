import { fireEvent, screen } from "@testing-library/react";

const pickNth = (elements: HTMLElement[], index: number, description: string): HTMLElement => {
  const element = elements[index];

  if (element === undefined) {
    throw new Error(`No element at index ${index} for "${description}"`);
  }

  return element;
};

export const typeInto = (label: string, value: string): void => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

export const typeIntoNth = (label: string, index: number, value: string): void => {
  fireEvent.change(pickNth(screen.getAllByLabelText(label), index, label), { target: { value } });
};

export const clickButton = (name: string): void => {
  fireEvent.click(screen.getByRole("button", { name }));
};

export const nthButton = (name: string, index: number): HTMLElement =>
  pickNth(screen.getAllByRole("button", { name }), index, name);
