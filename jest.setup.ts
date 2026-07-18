// React 19 exige este flag para que act(...) funcione fora do renderer do DOM.
// O preset do jest-expo não o define, então o RNTL avisa e os updates de estado
// assíncronos escapam do act.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
