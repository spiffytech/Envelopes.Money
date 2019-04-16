import React, { useState } from 'react';
import { start } from 'repl';

/**
 * A negative number means different things depending on whether this is
 * supposed to be a debit or credit transaction
 * @param startingValue
 * @param defaultType 
 */
function pickStartingTxnType(startingValue: number, defaultType: 'credit' | 'debit') {
  if (defaultType === 'debit') return startingValue < 0 ? 'credit' : 'debit';
  return startingValue < 0 ? 'debit' : 'credit';
}

export default function MoneyInput(
  {default: defaultValue, onChange, startingValue}:
  {default: 'credit' | 'debit', onChange: (n: number) => any, startingValue: number}
) {
  const [contents, setContents] = useState((Math.abs(startingValue) / 100).toString());
  const [txnType, setTxnType] = useState(pickStartingTxnType(startingValue, defaultValue));
  const [prevProp, setPrevProp] = useState(startingValue);
  // TODO: This implementation of getDerivedStateFromProps feel hacky because it
  // doesn't DRY the calculation with the above calculation
  if (startingValue !== prevProp)  {
    setContents((Math.abs(startingValue) / 100).toString());
    setTxnType(pickStartingTxnType(startingValue, defaultValue));
    setPrevProp(startingValue);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setContents(event.target.value);
    const num = parseFloat(event.target.value);
    if (!num) return;  // Not a number
    onChange(Math.round(num * (txnType === defaultValue ? 1 : -1) * 100));
  }

  function toggleTxnType(event: React.ChangeEvent<HTMLSelectElement>) {
    setTxnType(event.target.value as 'debit' | 'credit');
    const num = parseFloat(event.target.value);
    if (!num) return;  // Not a number
    onChange(Math.round(num * (txnType === defaultValue ? 1 : -1)));
  }

  return (
    <div className = 'flex flex-no-wrap'>
      <input
        type='number'
        step='.01'
        value={startingValue === 0 ? '' : contents }
        placeholder='0'
        onChange={handleChange}
        className='inline-block border w-24'
      />
      <select
        value={txnType}
        onChange={toggleTxnType}
        className={`inline-block border ${txnType === 'debit' ? 'bg-red-lightest' : 'bg-green-lightest'}`}
      >
        <option value='debit' className='bg-red-lightest'>Debit</option>
        <option value='credit' className='bg-green-lightest'>Credit</option>
      </select>
    </div>
  );
}
