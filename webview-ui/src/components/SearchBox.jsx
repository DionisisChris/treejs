import React from 'react';

const SearchBox = ({ placeholder, onSearch }) => {
  const handleChange = (event) => {
    onSearch(event.target.value);
  };

  return (
    <input
      type="text"
      placeholder={placeholder}
      onChange={handleChange}
    />
  );
};

export default SearchBox;
