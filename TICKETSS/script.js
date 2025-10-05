  <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Ticket selection
            const selectButtons = document.querySelectorAll('.select-btn');
            const ticketTypeInput = document.getElementById('ticket-type');
            const quantityInput = document.getElementById('quantity');
            const totalAmountInput = document.getElementById('total-amount');
            const paymentMethods = document.querySelectorAll('.payment-method');
            const confirmationModal = document.getElementById('confirmation-modal');
            const closeModalBtn = document.getElementById('close-modal');
            const downloadPdfBtn = document.getElementById('download-pdf');
            const pdfTicket = document.getElementById('pdf-ticket');
            
            let selectedTicketType = 'single';
            let selectedTicketPrice = 0.10;
            let selectedPaymentProvider = 'mtn';
            let currentConfirmationData = {};
            
            // Set initial values
            updateTotalAmount();
            
            // Handle ticket selection
            selectButtons.forEach(button => {
                button.addEventListener('click', function() {
                    selectedTicketType = this.getAttribute('data-type');
                    selectedTicketPrice = parseFloat(this.getAttribute('data-price'));
                    
                    // Update form
                    ticketTypeInput.value = this.getAttribute('data-type') === 'single' ? 'Single Ticket' : 'Double Ticket';
                    updateTotalAmount();
                    
                    // Visual feedback for selected ticket
                    selectButtons.forEach(btn => {
                        btn.textContent = 'Select Ticket';
                        btn.style.background = '#e94560';
                    });
                    
                    this.textContent = 'Selected';
                    this.style.background = '#28a745';
                });
            });
            
            // Handle quantity changes
            quantityInput.addEventListener('input', function() {
                updateTotalAmount();
            });
            
            // Handle payment method selection
            paymentMethods.forEach(method => {
                method.addEventListener('click', function() {
                    paymentMethods.forEach(m => m.classList.remove('active'));
                    this.classList.add('active');
                    selectedPaymentProvider = this.getAttribute('data-provider');
                });
            });
            
            // Close modal
            closeModalBtn.addEventListener('click', function() {
                confirmationModal.style.display = 'none';
            });
            
            // Download PDF
            downloadPdfBtn.addEventListener('click', function() {
                generateAndDownloadPDF();
            });
            
            // Update total amount
            function updateTotalAmount() {
                const quantity = parseInt(quantityInput.value) || 1;
                const total = selectedTicketPrice * quantity;
                totalAmountInput.value = `₵${total.toFixed(2)}`;
            }
            
            // Handle form submission
            const purchaseForm = document.getElementById('ticket-purchase-form');
            purchaseForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Get form data
                const formData = {
                    ticketType: ticketTypeInput.value,
                    quantity: quantityInput.value,
                    totalAmount: parseFloat(totalAmountInput.value.replace('₵', '')),
                    fullName: document.getElementById('full-name').value,
                    phone: document.getElementById('phone').value,
                    email: document.getElementById('email').value,
                    paymentProvider: selectedPaymentProvider
                };
                
                // Validate form
                if (!formData.fullName || !formData.phone || !formData.email) {
                    alert('Please fill in all required fields.');
                    return;
                }
                
                // Validate phone number format (Ghanaian)
                if (!isValidGhanaPhone(formData.phone)) {
                    alert('Please enter a valid Ghanaian phone number (e.g., 0241234567)');
                    return;
                }
                
                // Process payment with Paystack
                processPaystackPayment(formData);
            });
            
            // Validate Ghana phone number
            function isValidGhanaPhone(phone) {
                // Remove any spaces or special characters
                const cleanedPhone = phone.replace(/\D/g, '');
                
                // Check if it's a valid Ghanaian number (10 digits starting with 0)
                return /^0[2359]\d{8}$/.test(cleanedPhone);
            }
            
            // Generate confirmation code
            function generateConfirmationCode() {
                const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
                let code = 'YBP-';
                for (let i = 0; i < 6; i++) {
                    code += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return code;
            }
            
            // Simulate SMS sending
            function sendConfirmationSMS(phone, code, details) {
                console.log(`SMS sent to ${phone}:`);
                console.log(`Young Boys Party - Ticket Confirmation`);
                console.log(`Code: ${code}`);
                console.log(`Ticket: ${details.ticketType}`);
                console.log(`Quantity: ${details.quantity}`);
                console.log(`Amount: ₵${details.totalAmount}`);
                console.log(`Present this code at the entrance.`);
            }
            
            // Generate and download PDF
            function generateAndDownloadPDF() {
                // Update PDF content
                document.getElementById('pdf-code').textContent = currentConfirmationData.code;
                document.getElementById('pdf-name').textContent = currentConfirmationData.fullName;
                document.getElementById('pdf-phone').textContent = currentConfirmationData.phone;
                document.getElementById('pdf-ticket-type').textContent = currentConfirmationData.ticketType;
                document.getElementById('pdf-quantity').textContent = currentConfirmationData.quantity;
                document.getElementById('pdf-amount').textContent = `₵${currentConfirmationData.totalAmount}`;
                document.getElementById('pdf-date').textContent = new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                document.getElementById('pdf-reference').textContent = currentConfirmationData.reference;
                
                // Generate PDF
                const element = document.getElementById('pdf-ticket');
                const opt = {
                    margin: 10,
                    filename: `YoungBoysParty_Ticket_${currentConfirmationData.code}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                
                // Download PDF
                html2pdf().set(opt).from(element).save();
            }
            
            // Paystack Payment Integration
            function processPaystackPayment(formData) {
                // Show loading state
                const purchaseBtn = document.querySelector('.purchase-btn');
                const originalText = purchaseBtn.textContent;
                purchaseBtn.textContent = 'Processing...';
                purchaseBtn.disabled = true;
                
                // IMPORTANT: Replace with your actual Paystack public key
                const paystackPublicKey = 'pk_live_6fe1f1cfd0d04104c4cd4ac4c7d822511de1009d'; // Your Paystack LIVE public key
                
                // Generate a unique reference (you might want to use a better method in production)
                const reference = 'YBP_' + Math.floor((Math.random() * 1000000000) + 1);
                
                // Convert amount to pesewas (Paystack expects amount in pesewas for GHS)
                // 1 GHS = 100 pesewas, so 0.10 GHS = 10 pesewas
                const amountInPesewas = Math.round(formData.totalAmount * 100);
                
                // Configure Paystack handler
                const handler = PaystackPop.setup({
                    key: paystackPublicKey,
                    email: formData.email,
                    amount: amountInPesewas, // Amount in pesewas
                    currency: 'GHS',
                    channels: ['mobile_money'], // Restrict to mobile money only
                    ref: reference,
                    metadata: {
                        custom_fields: [
                            {
                                display_name: "Ticket Type",
                                variable_name: "ticket_type",
                                value: formData.ticketType
                            },
                            {
                                display_name: "Quantity",
                                variable_name: "quantity",
                                value: formData.quantity
                            },
                            {
                                display_name: "Phone",
                                variable_name: "phone",
                                value: formData.phone
                            },
                            {
                                display_name: "Full Name",
                                variable_name: "full_name",
                                value: formData.fullName
                            }
                        ]
                    },
                    callback: function(response) {
                        // Payment successful
                        console.log('Payment successful:', response);
                        
                        // Generate confirmation code
                        const confirmationCode = generateConfirmationCode();
                        
                        // Store confirmation data for PDF
                        currentConfirmationData = {
                            code: confirmationCode,
                            fullName: formData.fullName,
                            phone: formData.phone,
                            ticketType: formData.ticketType,
                            quantity: formData.quantity,
                            totalAmount: formData.totalAmount,
                            reference: response.reference
                        };
                        
                        // Send SMS with confirmation code
                        sendConfirmationSMS(formData.phone, confirmationCode, {
                            ticketType: formData.ticketType,
                            quantity: formData.quantity,
                            totalAmount: formData.totalAmount,
                            fullName: formData.fullName
                        });
                        
                        // Show confirmation modal
                        showConfirmationModal(confirmationCode, formData);
                        
                        // Reset form
                        resetForm();
                    },
                    onClose: function() {
                        // User closed the payment modal
                        alert('Payment was cancelled.');
                        purchaseBtn.textContent = originalText;
                        purchaseBtn.disabled = false;
                    }
                });
                
                // Open Paystack payment modal
                handler.openIframe();
            }
            
            // Show confirmation modal with details
            function showConfirmationModal(code, formData) {
                document.getElementById('confirmation-code').textContent = code;
                document.getElementById('confirm-name').textContent = formData.fullName;
                document.getElementById('confirm-phone').textContent = formData.phone;
                document.getElementById('confirm-ticket-type').textContent = formData.ticketType;
                document.getElementById('confirm-quantity').textContent = formData.quantity;
                document.getElementById('confirm-amount').textContent = `₵${formData.totalAmount}`;
                
                confirmationModal.style.display = 'flex';
            }
            
            // Reset form after successful payment
            function resetForm() {
                const purchaseForm = document.getElementById('ticket-purchase-form');
                const purchaseBtn = document.querySelector('.purchase-btn');
                
                purchaseForm.reset();
                ticketTypeInput.value = 'Single Ticket';
                totalAmountInput.value = '₵0.10';
                selectedTicketType = 'single';
                selectedTicketPrice = 0.10;
                
                // Reset ticket buttons
                selectButtons.forEach(btn => {
                    btn.textContent = 'Select Ticket';
                    btn.style.background = '#e94560';
                });
                
                // Reset payment method
                paymentMethods.forEach(m => m.classList.remove('active'));
                document.querySelector('.payment-method[data-provider="mtn"]').classList.add('active');
                selectedPaymentProvider = 'mtn';
                
                // Reset button
                purchaseBtn.textContent = 'Pay with Mobile Money';
                purchaseBtn.disabled = false;
            }
        });
    </script>