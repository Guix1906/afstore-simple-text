import { NavigateFunction } from 'react-router-dom';

export const goBackOr = (navigate: NavigateFunction, fallbackPath: string) => {
  if (window.history.length > 1) {
    navigate(-1);
    return;
  }

  navigate(fallbackPath, { replace: true });
};
