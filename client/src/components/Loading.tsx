import React, { useEffect, useState } from 'react';
export default function Loading({loading}: {loading: string | null}) {
  return loading ? <span>{loading}</span> : null;
}
