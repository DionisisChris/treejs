import React from 'react';

const FilterMenu = ({ filters, onFilterChange }) => {
  const handleChange = (event, filter) => {
    const newFilters = filters.map(f => 
      f.value === filter.value ? { ...f, checked: event.target.checked } : f
    );
    onFilterChange(newFilters);
  };

  return (
    <div>
      {filters.map(filter => (
        <div key={filter.value}>
          <label>
            <input
              type="checkbox"
              checked={filter.checked || false}
              onChange={(event) => handleChange(event, filter)}
            />
            {filter.label}
          </label>
        </div>
      ))}
    </div>
  );
};

export default FilterMenu;
