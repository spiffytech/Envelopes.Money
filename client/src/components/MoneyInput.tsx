import React, { useState } from 'react';

/**
 * A negative number means different things depending on whether this is
 * supposed to be a debit or credit transaction
 * @param defaultValue
 * @param defaultType 
 */
function pickStartingTxnType(defaultValue: number, defaultType: 'credit' | 'debit') {
  if (defaultType === 'debit') return defaultValue < 0 ? 'credit' : 'debit';
  return defaultValue < 0 ? 'debit' : 'credit';
}

export default function MoneyInput(
  {default: defaultType, onChange, startingValue: defaultValue}:
  {default: 'credit' | 'debit', onChange: (n: number) => any, startingValue: number}
) {
  const [contents, setContents] = useState((Math.abs(defaultValue) / 100).toString());
  const [txnType, setTxnType] = useState(pickStartingTxnType(defaultValue, defaultType));
  const [prevProp, setPrevProp] = useState(defaultValue);
  // TODO: This implementation of getDerivedStateFromProps feel hacky because it
  // doesn't DRY the calculation with the above calculation

  const defaultValueStr = (defaultValue / 100).toFixed(2)

  if (defaultValue !== prevProp)  {
    setContents((Math.abs(defaultValue) / 100).toString());
    setTxnType(pickStartingTxnType(defaultValue, defaultType));
    setPrevProp(defaultValue);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setContents(event.target.value);
    const num = parseFloat(event.target.value);
    if (!num) return;  // Not a number
    onChange(Math.round(num * (txnType === defaultType ? 1 : -1) * 100));
  }

  function toggleTxnType(event: React.ChangeEvent<HTMLSelectElement>) {
    setTxnType(event.target.value as 'debit' | 'credit');
    const num = parseFloat(contents);
    if (!num) return;  // Not a number
    onChange(Math.round(num * (txnType === defaultType ? 1 : -1) * 100));
  }

  return (
    <div className = 'flex flex-no-wrap'>
      <input
        type='number'
        step='.01'
        defaultValue={defaultValue === 0 ? '' : defaultValueStr }
        placeholder='0'
        onInput={handleChange}
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
