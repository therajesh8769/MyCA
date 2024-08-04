function toggleMenu() {
    document.body.classList.toggle('nav-open');
}

const categorySelect = document.getElementById('category');
const customCategoryInput = document.getElementById('customCategoryInput'); // Remove the space before 'customCategoryInput'
 // Change to 'catInput'

 
 const savedCategories=JSON.parse(localStorage.getItem('categories')) || [];
 savedCategories.forEach(category=>
    {
        const option=document.createElement('option');
        option.value=category;
        option.text=category;
        categorySelect.appendChild(option);
    }
 );
 














categorySelect.addEventListener('change', function() {
    if (categorySelect.value === 'custom') {
        customCategoryInput.style.display = 'block'; // Change to 'customCategoryInput'
        customCategoryInput.required = true;
        customCategoryInput.focus();
    } else {
        customCategoryInput.style.display = 'none'; // Change to 'customCategoryInput'
        customCategoryInput.required = false;
    }
});

customCategoryInput.addEventListener('input', function() { // Change to 'customCategoryInput'
    const newCategory = customCategoryInput.value.trim(); // Change to 'customCategoryInput'
    console.log("New category:", newCategory);
    if (newCategory !== '') {
        const newOption = document.createElement('option');
        newOption.value = newCategory;
        categorySelect.appendChild(newOption);
        categorySelect.value = newCategory;
        newOption.innerText = newOption.value;



        savedCategories.push(newCategory);
            localStorage.setItem('categories', JSON.stringify(savedCategories));

        customCategoryInput.style.display = 'none';
        customCategoryInput.required = false; 
        customCategoryInput.value = '';
    }
});
