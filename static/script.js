let products = []; // Initialize products array

const addItem = async (productName, productPrice, productDescription) => {
    const request = await fetch(
        "/items", {
        method: "POST",
        headers: {
            "Content-Type": "application/json" // Ensure the correct Content-Type header
        },
        body: JSON.stringify({
            item: productName,
            price: productPrice,
            description: productDescription
        }),
    });
    const response = await request.json();
    console.log(response);
    // Refresh product list after adding new item
    fetchProducts();
};

const editItem = async (item_id, productName, productPrice, productDescription) => {
    const request = await fetch(
        `/items/${item_id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json" // Ensure the correct Content-Type header
        },
        body: JSON.stringify({
            item: productName,
            price: productPrice,
            description: productDescription
        }),
    });
    const response = await request.json();
    console.log(response);
    // Refresh product list after editing item
    fetchProducts();
};

const deleteItem = async (item_id) => {
    const request = await fetch(
        `/items/${item_id}`, {
        method: "DELETE"
    });
    const response = await request.json();
    console.log(response);
    // Refresh product list after deleting item
    fetchProducts();
};

// Function to fetch products from backend
const fetchProducts = async () => {
    try {
        const response = await fetch("/items");
        const data = await response.json();
        products = data
        renderProducts();
    } catch (error) {
        console.error("Error fetching products:", error);
    }
};

// Function to render product list
function renderProducts() {
    const tableBody = document.querySelector('table tbody');
    tableBody.innerHTML = '';

    if (products) {
        console.log("items here", products)
        products.forEach((product, index) => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${product.item}</td>
                <td>${product.price}</td>
                <td>${product.description}</td>
                <td>
                    <button class="select-item-btn" onclick="showQuantityContainer(${index})">Select Item</button>
                    <div class="quantity-container" id="quantityContainer${index}">
                        <input type="number" id="quantityInput${index}" value="0" min="0">
                    </div>
                    <button class="edit-btn" onclick="showEditPopup(${index})">Edit</button>
                    <button class="delete-btn" onclick="showDeletePopup(${index})">Delete</button>
                </td>
            `;
        });
    } else {
        console.log("No products to render.");
    }
}

// Function to add a new product
function addProduct(event) {
    event.preventDefault();

    const productName = document.getElementById('productName').value;
    const productPrice = document.getElementById('productPrice').value;
    const productDescription = document.getElementById('productDescription').value;

    addItem(productName, productPrice, productDescription);

    document.getElementById('productForm').reset();
}

// Function to show edit popup
function showEditPopup(index) {
    const product = products[index];
    console.log("item here",product)
    document.getElementById('editProductName').value = product.item;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductDescription').value = product.description;

    document.getElementById('editPopup').style.display = 'flex';
    document.getElementById('saveEditBtn').onclick = function() {
        const updatedName = document.getElementById('editProductName').value;
        const updatedPrice = document.getElementById('editProductPrice').value;
        const updatedDescription = document.getElementById('editProductDescription').value;

        editItem(product.item_id, updatedName, updatedPrice, updatedDescription);
    };
    document.getElementById('cancelEditBtn').onclick = function() {
        closeEditPopup();
    };
}

// Function to close edit popup
function closeEditPopup() {
    document.getElementById('editPopup').style.display = 'none';
}

// Function to show delete popup
function showDeletePopup(index) {
    const product = products[index];
    document.getElementById('deleteConfirmation').textContent = `Are you sure you want to delete ${product.item}?`;
    document.getElementById('deletePopup').style.display = 'flex';
    document.getElementById('confirmDeleteBtn').onclick = function() {
        deleteItem(product.item_id);
        closeDeletePopup();
    };
    document.getElementById('cancelDeleteBtn').onclick = function() {
        closeDeletePopup();
    };
}

// Function to close delete popup
function closeDeletePopup() {
    document.getElementById('deletePopup').style.display = 'none';
}

// Function to show quantity container
function showQuantityContainer(index) {
    const quantityContainer = document.getElementById(`quantityContainer${index}`);
    quantityContainer.classList.toggle('show');
}

// Function to generate bill
function generateBill() {
    const billPopup = document.getElementById('billPopup');
    const billItemsDiv = document.getElementById('billItems');
    const billTotalSpan = document.getElementById('billTotal');

    billItemsDiv.innerHTML = '';

    let total = 0;

    products.forEach((product, index) => {
        const quantityInput = document.getElementById(`quantityInput${index}`);
        const quantity = parseInt(quantityInput.value);
        
        if (quantity > 0) {
            const subtotal = parseFloat(product.price) * quantity;
            total += subtotal;
            billItemsDiv.innerHTML += `<p>${product.item} - Quantity: ${quantity} - Subtotal: $${subtotal.toFixed(2)}</p>`;
        }
    });

    billTotalSpan.textContent = `$${total.toFixed(2)}`;

    billPopup.style.display = 'flex';

    document.getElementById('closeBillBtn').onclick = function() {
        billPopup.style.display = 'none';
    };
}

// Initial fetching of products
fetchProducts();

// Event listener for form submission
document.getElementById('productForm').addEventListener('submit', addProduct);