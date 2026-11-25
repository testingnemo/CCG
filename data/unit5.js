/* ============================================================
   COOL CODING GAME — UNIT V CONTENT: "Model Optimization & Deployment" (12h)
   Course: 26 UBAI 601 · Region: DEPLOYMENT CITADEL (east zone) — 6 locations
   Code snippets kept rare (only u5l5 includes a compact Save/Load snippet).
   ============================================================ */

window.COURSE_CONTENT = window.COURSE_CONTENT || {};

/* ---- u5l1 · Dropout & Regularization ---- */
COURSE_CONTENT['u5l1'] = {
  title: 'Dropout & Regularization',
  topic: 'Preventing overfitting so models generalize beyond training data',
  learn: [
    'Welcome to DEPLOYMENT CITADEL! A huge network can memorize training noise (overfitting)—getting 99% train accuracy but failing in production.',
    'Dropout randomly zeroes a fraction p of neuron activations each training step, forcing redundant, co-adaptation-free features.',
    'At test/inference time Dropout turns OFF (using model.eval()), while inverted scaling keeps expected activation magnitudes matched!'
  ],
  quiz: [
    { q: 'What problem is Dropout primarily designed to prevent?',
      a: ['Overfitting and neuron co-adaptation on the training set', 'Underfitting due to too few parameters', 'Vanishing gradients in linear regression', 'Slow disk reads during saving'],
      correct: 0, why: 'Dropping random units forces the network to distribute knowledge across many independent paths.' },
    { q: 'How does Dropout behave during inference / evaluation (model.eval())?',
      a: ['It is disabled so all neurons contribute deterministically', 'It drops 90% of neurons randomly on every request', 'It deletes the output layer', 'It re-runs backpropagation on test inputs'],
      correct: 0, why: 'Predictions at test time should be deterministic and use the full ensemble of learned features.' },
    { q: 'What is a classic symptom of overfitting?',
      a: ['Training loss keeps dropping while validation loss starts rising', 'Both training and validation accuracy are low', 'Training and validation loss drop together smoothly', 'The model has zero parameters'],
      correct: 0, why: 'Diverging validation loss means the model is memorizing training quirks rather than generalizable patterns.' },
    { q: 'Besides Dropout, what does L2 Regularization (Weight Decay) do?',
      a: ['Penalizes large weight magnitudes to keep decision boundaries smoother', 'Forces half the inputs to equal 1', 'Doubles the batch size each epoch', 'Replaces ReLU with Softmax'],
      correct: 0, why: 'Adding lambda * ||w||^2 discourages extreme weights that overfit noisy examples.' },
    { q: 'Why does inverted Dropout divide kept activations by (1 - p) during training?',
      a: ['So expected activation magnitudes match inference without needing extra test-time scaling', 'To make training loss negative', 'To ensure Softmax sums to 2', 'To skip the backward pass'],
      correct: 0, why: 'Scaling during training keeps evaluation fast and clean with no scaling factor needed at test time.' }
  ]
};

/* ---- u5l2 · Batch Normalization ---- */
COURSE_CONTENT['u5l2'] = {
  title: 'Batch Normalization',
  topic: 'Normalizing layer activations with learned scale (γ) and shift (β)',
  learn: [
    'As earlier weights update during training, the distribution of inputs seen by deeper layers shifts constantly—slowing convergence.',
    'Batch Normalization normalizes each feature across the mini-batch to zero mean and unit variance, then applies learnable scale γ and shift β.',
    'BatchNorm stabilizes gradients, permits higher learning rates, and uses running mean/variance statistics during inference!'
  ],
  quiz: [
    { q: 'What does a Batch Normalization layer compute during training?',
      a: ['Mini-batch mean and variance to normalize activations, followed by learnable scale γ and shift β', 'Random neuron dropout masks', '3x3 spatial max pooling', 'Hyperparameter grid combinations'],
      correct: 0, why: 'Normalizing per mini-batch plus learnable affine parameters (γ, β) keeps activations well-behaved.' },
    { q: 'Why do BatchNorm layers include learnable parameters γ (gamma) and β (beta)?',
      a: ['So the network can restore any useful mean/scale if strict zero-mean unit-variance is too restrictive', 'To specify the number of training epochs', 'To replace the loss function', 'To store test labels'],
      correct: 0, why: 'γ and β preserve representational capacity while keeping activation distributions stable.' },
    { q: 'How does BatchNorm behave during inference (model.eval())?',
      a: ['It uses running average mean and variance tracked during training rather than current batch stats', 'It skips normalization completely', 'It computes statistics from a single test sample even if batch size is 1', 'It freezes all weights permanently on disk'],
      correct: 0, why: 'Using running statistics guarantees single-sample inference works deterministically.' },
    { q: 'What practical training benefits does Batch Normalization provide?',
      a: ['Faster convergence, smoother loss landscapes, and tolerance for higher learning rates', 'Zero memory usage', 'Eliminates the need for labeled data', 'Automatically picks the number of classes'],
      correct: 0, why: 'Well-scaled activations prevent gradients from vanishing or exploding across deep stacks.' },
    { q: 'Why can BatchNorm degrade if mini-batch size is tiny (e.g. batch size = 1 or 2)?',
      a: ['Tiny batches give noisy, unreliable estimates of true mean and variance', 'BatchNorm requires batch size > 100,000', 'Gradients turn into integers', 'Dropout automatically triggers an error'],
      correct: 0, why: 'With very small batches, LayerNorm or GroupNorm is often preferred over BatchNorm.' }
  ]
};

/* ---- u5l3 · Adam & RMSProp ---- */
COURSE_CONTENT['u5l3'] = {
  title: 'Optimization: Adam & RMSProp',
  topic: 'Adaptive learning rates, momentum, and bias-corrected updates',
  learn: [
    'Plain SGD uses one fixed learning rate for every weight, which struggles in narrow ravines or sparse-feature landscapes.',
    'RMSProp tracks an exponential moving average of squared gradients, shrinking steps on steep oscillating axes and boosting flat ones.',
    'Adam (Adaptive Moment Estimation) combines Momentum (1st moment mean) + RMSProp (2nd moment uncentered variance) with bias correction!'
  ],
  quiz: [
    { q: 'Which two ideas does the Adam optimizer combine?',
      a: ['Momentum (1st moment) and RMSProp adaptive scaling (2nd moment)', 'Dropout and MaxPooling', 'Grid Search and Early Stopping', 'Autoencoder and GAN discriminator'],
      correct: 0, why: 'Adam maintains exponential averages of both gradients (m_t) and squared gradients (v_t).' },
    { q: 'How does RMSProp adjust the step size for each parameter?',
      a: ['Divides the learning rate by the root of a running average of squared gradients', 'Multiplies every weight by 2 each epoch', 'Uses the exact same fixed step for every parameter', 'Only updates weights on the final layer'],
      correct: 0, why: 'Parameters with large noisy gradients get damped steps, while gentle directions move steadily.' },
    { q: 'What problem does Momentum solve compared to vanilla SGD?',
      a: ['Accelerates through consistent flat directions and dampens zig-zag oscillations', 'Eliminates the need for a training set', 'Replaces Cross-Entropy with MSE', 'Compresses saved model files'],
      correct: 0, why: 'Velocity accumulates along persistent gradient directions while opposing oscillations cancel out.' },
    { q: 'Why does Adam apply bias correction to m_t and v_t in early steps?',
      a: ['Because both moving averages are initialized at zero and start biased toward zero', 'To remove class imbalance in the dataset', 'To fix overfitting on the test set', 'To convert PyTorch tensors to NumPy'],
      correct: 0, why: 'Dividing by (1 - beta^t) corrects the zero-initialization lag during the first iterations.' },
    { q: 'What does AdamW improve over standard Adam when using L2 weight decay?',
      a: ['It decouples weight decay from the adaptive gradient scaling step', 'It removes the first moment estimate', 'It forces learning rate to equal 1.0', 'It trains without gradients'],
      correct: 0, why: 'Decoupled weight decay applies regularization cleanly without distortion by adaptive denominators.' }
  ]
};

/* ---- u5l4 · Hyperparameter Tuning ---- */
COURSE_CONTENT['u5l4'] = {
  title: 'Hyperparameter Tuning',
  topic: 'Grid search, validation splits, and tuning learning rates & capacity',
  learn: [
    'Weights are learned by gradient descent; hyperparameters—learning rate, batch size, hidden width, dropout rate—are set BEFORE training.',
    'Grid Search tests every combination across a predefined parameter grid on the validation split (never tune on the test set!).',
    'Always inspect validation curves: Learning Rate is usually the single most sensitive hyperparameter, followed by depth/width and regularization.'
  ],
  quiz: [
    { q: 'Which of these is a hyperparameter rather than a learned model parameter?',
      a: ['Learning rate and batch size', 'Convolutional kernel weights', 'Neuron bias values after training', 'BatchNorm learned gamma values'],
      correct: 0, why: 'Hyperparameters configure training and architecture before optimization learns weights and biases.' },
    { q: 'How does Grid Search work?',
      a: ['Evaluates every combination in a chosen Cartesian grid of hyperparameter values', 'Differentiates hyperparameters with backpropagation', 'Trains only one random configuration', 'Merges train and test sets together'],
      correct: 0, why: 'Grid search systematically tests all combinations of specified discrete candidate values.' },
    { q: 'Which dataset split must you use to pick the best hyperparameters?',
      a: ['The Validation set, keeping the Test set untouched until final evaluation', 'The Test set repeatedly after every run', 'Only a single training sample', 'Unlabeled production logs without ground truth'],
      correct: 0, why: 'Tuning directly on the test set leaks test information and yields overly optimistic estimates.' },
    { q: 'Why can Grid Search become expensive in high-dimensional hyperparameter spaces?',
      a: ['The number of runs grows exponentially with each added hyperparameter', 'It runs backprop twice per pixel', 'It requires saving 100 copies of raw images', 'Grid search disables GPU acceleration'],
      correct: 0, why: 'Testing 4 values across 5 hyperparameters already demands 4^5 = 1,024 full training runs.' },
    { q: 'What is "Early Stopping" in DL optimization?',
      a: ['Halting training and restoring best weights when validation loss stops improving', 'Stopping before epoch 1 begins', 'Cutting off the final layer at test time', 'Lowering batch size to zero'],
      correct: 0, why: 'Early stopping captures the sweet spot before overfitting degrades validation performance.' }
  ]
};

/* ---- u5l5 · Model Evaluation & Saving (Rare Code Milestone 5/5) ---- */
COURSE_CONTENT['u5l5'] = {
  title: 'Model Evaluation & Saving',
  topic: 'Evaluation metrics and persisting trained weights cleanly',
  python: [
    '# Practical 13: save & reload weights cleanly',
    'torch.save(model.state_dict(), "dlna_model.pt")',
    '',
    'loaded = MyNet()',
    'loaded.load_state_dict(torch.load("dlna_model.pt"))',
    'loaded.eval()   # switch Dropout & BatchNorm to eval!'
  ],
  learn: [
    'Accuracy alone lies on imbalanced datasets—also track Precision, Recall, F1-score, ROC-AUC, or MAE/RMSE for regression.',
    'Once evaluated on the held-out test set, persist the trained model: PyTorch saves state_dict weights (.pt), while Keras exports .keras / SavedModel.',
    'When reloading for prediction, always restore the exact architecture and call model.eval() so Dropout and BatchNorm behave deterministically!'
  ],
  quiz: [
    { q: 'Why is accuracy misleading on a dataset where 99% of samples are negative?',
      a: ['A dummy model predicting all negative gets 99% accuracy while missing every positive case', 'Accuracy cannot be computed for binary classes', 'Negative classes always have zero loss', 'Cross-entropy ignores minority classes'],
      correct: 0, why: 'Precision, Recall, and F1-score reveal how well the model detects rare positive cases.' },
    { q: 'Why is saving model.state_dict() recommended in PyTorch?',
      a: ['It saves learned weights cleanly without coupling tightly to brittle Python class pickle paths', 'It deletes the architecture permanently', 'It compresses datasets by 100x', 'It runs hyperparameter grid search automatically'],
      correct: 0, why: 'state_dict stores the tensor weights dictionary cleanly and portably.' },
    { q: 'What critical step must follow loading a saved PyTorch model before running predictions?',
      a: ['Calling model.eval() (and torch.no_grad())', 'Calling model.train() and resetting weights', 'Re-running 50 epochs on test data', 'Deleting all BatchNorm layers'],
      correct: 0, why: 'model.eval() locks Dropout off and switches BatchNorm to saved running statistics.' },
    { q: 'What is a Confusion Matrix used for in model evaluation?',
      a: ['Breaking down true positives, false positives, true negatives, and false negatives per class', 'Shuffling weights during backpropagation', 'Initializing Xavier kernels', 'Converting tokens into embeddings'],
      correct: 0, why: 'A confusion matrix exposes exactly which classes the model confuses with one another.' },
    { q: 'Why should test-set evaluation happen ONLY after training and tuning are complete?',
      a: ['So the test score remains an unbiased measure of real-world generalization', 'Because test sets cannot be loaded into RAM earlier', 'Because backprop throws an error on test data', 'Because Softmax requires training to finish first'],
      correct: 0, why: 'Keeping the test set strictly held out ensures an honest estimate of unseen performance.' }
  ]
};

/* ---- u5l6 · Inference Pipelines & Capstone ---- */
COURSE_CONTENT['u5l6'] = {
  title: 'Inference Pipelines & Deployment',
  topic: 'Serving models reliably with preprocessing parity and low latency',
  learn: [
    'Congratulations on reaching the final site! Deploying a DL model means wrapping preprocessing, model forward pass, and postprocessing into an inference pipeline.',
    'Golden rule of deployment: inference preprocessing (resizing, normalization mean/std, tokenizer vocab) MUST match training preprocessing identically!',
    'Production pipelines often export to ONNX or TorchScript, batch requests, quantize weights for speed, and monitor prediction drift over time.'
  ],
  quiz: [
    { q: 'What is "training-serving skew" in an inference pipeline?',
      a: ['A mismatch between preprocessing used at training time versus production inference', 'Using Adam instead of RMSProp', 'Training on GPUs and saving to SSD', 'Using ReLU in hidden layers'],
      correct: 0, why: 'Different normalization scales, channel orders (RGB vs BGR), or tokenizers silently ruin production accuracy.' },
    { q: 'Why wrap inference in torch.no_grad() (or framework equivalent)?',
      a: ['Disables gradient tracking, cutting memory usage and speeding up predictions', 'Enables backpropagation during serving', 'Automatically retrains on user requests', 'Increases Dropout probability to 0.5'],
      correct: 0, why: 'Inference needs no backward graph, so skipping autograd saves substantial VRAM and latency.' },
    { q: 'What does exporting a model to ONNX enable?',
      a: ['Portable high-speed inference across different runtimes, CPUs, GPUs, and edge devices', 'Automatic dataset labeling', 'Increasing model parameter count 10x', 'Skipping input preprocessing'],
      correct: 0, why: 'ONNX provides a standard graph format independent of the original training framework.' },
    { q: 'How does model quantization speed up deployed Deep Learning inference?',
      a: ['Converts 32-bit floats to smaller precision like FP16 or INT8 with minimal accuracy loss', 'Deletes half the training images', 'Removes all activation functions', 'Doubles batch size infinitely'],
      correct: 0, why: 'Lower-precision arithmetic reduces memory bandwidth and accelerates inference on edge and server hardware.' },
    { q: 'Why monitor deployed DL models after launch?',
      a: ['Real-world input distributions drift over time, degrading model accuracy', 'Weights decay physically on disk every week', 'Softmax outputs stop summing to 1 after 30 days', 'BatchNorm erases saved checkpoints'],
      correct: 0, why: 'Data drift and concept drift require ongoing monitoring, evaluation, and periodic retraining.' }
  ]
};
