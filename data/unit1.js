/* ============================================================
   COOL CODING GAME — UNIT I CONTENT: "Deep Learning Fundamentals" (12h)
   Course: 26 UBAI 601 · Region: PERCEPTRON MEADOWS (south bank) — 5 locations
   Code snippets kept rare (only u1l5 includes a compact training snippet).
   ============================================================ */

window.COURSE_CONTENT = window.COURSE_CONTENT || {};

/* ---- u1l1 · ML to DL Evolution ---- */
COURSE_CONTENT['u1l1'] = {
  title: 'Evolution from ML to DL',
  topic: 'From handcrafted features to deep representation learning',
  learn: [
    'Welcome to PERCEPTRON MEADOWS! I am PY 🐍, your guide through 26 UBAI 601: Deep Learning & Neural Architectures.',
    'Traditional Machine Learning relies on human experts to engineer features manually before feeding a classifier.',
    'Deep Learning stacks many neural layers so the model automatically learns hierarchical representations directly from raw pixels, audio, or text.',
    'Driven by large datasets, GPUs, and better optimizers, DL powers vision, speech recognition, medical imaging, and generative AI.'
  ],
  quiz: [
    { q: 'What is the main advantage of Deep Learning over classical Machine Learning on raw images or audio?',
      a: ['It learns hierarchical features automatically from raw data', 'It requires zero training data', 'It never needs a loss function', 'It only runs on single-core CPUs'],
      correct: 0, why: 'Deep networks replace brittle manual feature engineering with multi-layer representation learning.' },
    { q: 'Which three factors fueled the modern rise of Deep Learning?',
      a: ['Big datasets, GPU/TPU compute, and improved architectures', 'Floppy disks, dial-up modems, and manual rules', 'Smaller datasets and shallower linear models', 'Removing all hidden layers'],
      correct: 0, why: 'Large labeled/unlabeled corpora, parallel GPU acceleration, and better training techniques enabled deep networks to scale.' },
    { q: 'In a deep image network, what do early vs deeper layers typically capture?',
      a: ['Early layers detect edges/textures; deeper layers detect object parts', 'Early layers detect full faces; deeper layers detect single pixels', 'Every layer learns identical pixel copies', 'Only the final layer has weights'],
      correct: 0, why: 'Deep networks compose simple patterns in early layers into complex semantic concepts in deeper layers.' },
    { q: 'Which task is a classic real-world application of Deep Learning?',
      a: ['Autonomous driving perception and medical scan diagnosis', 'Calculating a fixed static tax table', 'Sorting an already indexed SQL column', 'Compressing files with zip'],
      correct: 0, why: 'High-dimensional unstructured data like camera feeds, MRI scans, and speech are Deep Learning strongholds.' },
    { q: 'Compared to shallow ML models, Deep Learning performance typically…',
      a: ['Continues improving as data and model capacity scale together', 'Immediately peaks at 50 training examples', 'Drops to zero when given more examples', 'Never benefits from validation data'],
      correct: 0, why: 'Deep models have high representational capacity that benefits strongly from large datasets.' }
  ]
};

/* ---- u1l2 · Perceptron & MLP ---- */
COURSE_CONTENT['u1l2'] = {
  title: 'Perceptron & MLP',
  topic: 'From single linear threshold units to Multi-Layer Perceptrons',
  learn: [
    'A Perceptron takes inputs x, multiplies each by a weight w, adds a bias b, and applies an activation function: y = f(w·x + b).',
    'Because a single perceptron only draws one straight hyperplane, it famously cannot solve non-linearly separable problems like XOR.',
    'Stacking hidden layers between input and output creates a Multi-Layer Perceptron (MLP) capable of approximating any continuous function!'
  ],
  quiz: [
    { q: 'Why can a single-layer perceptron NOT learn the XOR function?',
      a: ['XOR is not linearly separable by a single straight line', 'XOR has too many output classes', 'Perceptrons cannot take binary inputs', 'Bias terms are forbidden in XOR'],
      correct: 0, why: 'A single perceptron computes one linear boundary w·x + b = 0, which cannot separate XOR corners.' },
    { q: 'What role does the bias term (b) play inside a neuron?',
      a: ['It shifts the activation threshold independently of the inputs', 'It forces all weights to stay positive', 'It deletes zero inputs during inference', 'It doubles the learning rate'],
      correct: 0, why: 'Bias translates the decision boundary away from the origin so the neuron can fire even when inputs are zero.' },
    { q: 'What makes a Multi-Layer Perceptron (MLP) more expressive than a linear stack of layers?',
      a: ['Non-linear activation functions between hidden layers', 'Removing the bias from every neuron', 'Using only one hidden neuron', 'Repeating linear matrix multiplications without activations'],
      correct: 0, why: 'Without non-linear activations, any stack of linear layers collapses mathematically into a single linear transform.' },
    { q: 'In an MLP, how are adjacent layers typically connected?',
      a: ['Fully connected (dense): every neuron links to every neuron in the next layer', 'Each neuron connects to only one fixed input pixel', 'Only the first and last layers have weights', 'Connections flow backward during inference'],
      correct: 0, why: 'Standard MLPs use dense (fully connected) layers where each unit receives all outputs of the previous layer.' },
    { q: 'Why do practical MLPs need hidden layers?',
      a: ['Hidden layers create intermediate feature representations for non-linear decisions', 'Hidden layers store the raw test dataset', 'Hidden layers eliminate the need for training labels', 'Hidden layers disable backpropagation'],
      correct: 0, why: 'Hidden layers warp the input space into a representation where the final layer can separate classes cleanly.' }
  ]
};

/* ---- u1l3 · Activation Functions ---- */
COURSE_CONTENT['u1l3'] = {
  title: 'Activation Functions',
  topic: 'Sigmoid, Tanh, ReLU, and Softmax — giving networks non-linearity',
  learn: [
    'Activation functions decide how strongly a neuron fires and inject the non-linearity that lets deep networks bend decision boundaries.',
    'Sigmoid squashes values to (0, 1) and Tanh to (-1, 1), but both saturate at large magnitudes and can shrink gradients toward zero.',
    'ReLU computes max(0, x): fast, sparse, and avoids positive saturation—while Softmax turns output logits into probabilities summing to 1.'
  ],
  quiz: [
    { q: 'What is the output range of the Sigmoid activation function?',
      a: ['(0, 1)', '(-1, 1)', '(-infinity, +infinity)', '[0, +infinity)'],
      correct: 0, why: 'Sigmoid maps any real number smoothly into (0, 1), making it useful for binary probability outputs.' },
    { q: 'Why is ReLU (max(0, x)) preferred over Sigmoid in deep hidden layers?',
      a: ['It does not saturate for positive inputs and computes very fast', 'It outputs values centered between -1 and 1', 'It converts logits into class probabilities', 'It guarantees zero overfitting'],
      correct: 0, why: 'ReLU has gradient 1 for x > 0, avoiding the severe vanishing gradient saturation of Sigmoid in deep stacks.' },
    { q: 'How does Tanh differ from Sigmoid?',
      a: ['Tanh is zero-centered with outputs in (-1, 1)', 'Tanh only outputs integers', 'Tanh is strictly non-differentiable everywhere', 'Tanh is used only for multi-class output normalization'],
      correct: 0, why: 'Zero-centered (-1, 1) activations often help hidden-layer optimization compared to (0, 1) Sigmoid outputs.' },
    { q: 'When should Softmax be used in a neural network?',
      a: ['On the output layer for mutually exclusive multi-class classification', 'Inside every hidden convolutional block', 'To compute regression house prices', 'To replace the loss function'],
      correct: 0, why: 'Softmax exponentiates and normalizes logits into a probability distribution summing to 1 across classes.' },
    { q: 'What is the "dying ReLU" problem?',
      a: ['Neurons stuck at x <= 0 output 0 and receive zero gradient forever', 'Weights grow to infinity during inference', 'Softmax probabilities sum to more than 1', 'Loss drops too quickly on the test set'],
      correct: 0, why: 'When a ReLU unit stays negative for all inputs, its derivative is 0 and gradient descent cannot revive it.' }
  ]
};

/* ---- u1l4 · Loss Functions ---- */
COURSE_CONTENT['u1l4'] = {
  title: 'Loss Functions',
  topic: 'Measuring prediction error with MSE and Cross-Entropy',
  learn: [
    'A loss function scores how wrong the network is on a training example—giving gradient descent a compass to follow.',
    'Mean Squared Error (MSE) averages squared differences (y - y_hat)^2 and shines on continuous regression targets.',
    'Cross-Entropy measures divergence between true labels and predicted probabilities, penalizing confident wrong predictions sharply.'
  ],
  quiz: [
    { q: 'Which loss function is standard for predicting continuous numeric values (regression)?',
      a: ['Mean Squared Error (MSE)', 'Categorical Cross-Entropy', 'BLEU Score', 'Perceptron Step Count'],
      correct: 0, why: 'MSE computes the mean of (y - y_hat)^2, directly penalizing numeric prediction distance.' },
    { q: 'Which loss pairs naturally with Softmax for multi-class classification?',
      a: ['Categorical Cross-Entropy', 'Mean Squared Error', 'Cosine Annealing', 'L1 Weight Decay'],
      correct: 0, why: 'Cross-Entropy gives strong, clean gradients when combined with Softmax probabilities.' },
    { q: 'Why does Cross-Entropy outperform MSE for classification with Sigmoid/Softmax outputs?',
      a: ['It avoids tiny gradient plateaus when a confident prediction is wrong', 'It ignores misclassified examples', 'It eliminates the need for backpropagation', 'It works only without activation functions'],
      correct: 0, why: 'With Sigmoid + MSE, saturated wrong outputs produce near-zero gradients, whereas Cross-Entropy cancels the saturation.' },
    { q: 'If a binary classifier predicts probability 0.01 when the true label is 1, Binary Cross-Entropy is…',
      a: ['Very high, strongly penalizing the confident mistake', 'Zero because 0.01 is close to 0', 'Negative infinity', 'Identical to predicting 0.99'],
      correct: 0, why: '-log(0.01) is large, pushing weights strongly toward predicting higher probability for class 1.' },
    { q: 'What is the goal of training with respect to the loss function?',
      a: ['Minimize the expected loss on unseen data without overfitting', 'Maximize the training loss at every epoch', 'Keep the loss constant across all epochs', 'Evaluate loss only once before initialization'],
      correct: 0, why: 'Lower loss means model predictions match ground truth closely, provided generalization holds on validation data.' }
  ]
};

/* ---- u1l5 · Backprop & Training (Rare Code Milestone 1/5) ---- */
COURSE_CONTENT['u1l5'] = {
  title: 'Backpropagation & Training',
  topic: 'Forward propagation, chain rule, and weight updates',
  python: [
    '# Practical 1: one MLP training step in PyTorch',
    'pred = model(x)                  # 1. forward pass',
    'loss = loss_fn(pred, y)          # 2. compute loss',
    'optimizer.zero_grad()            # 3. clear old grads',
    'loss.backward()                  # 4. backprop (chain rule)',
    'optimizer.step()                 # 5. update weights'
  ],
  learn: [
    'Training alternates two passes: forward propagation computes predictions and loss; backpropagation sends error gradients backward.',
    'Backpropagation applies the calculus chain rule layer by layer to measure how much each weight contributed to the loss.',
    'Gradient descent then nudges each weight opposite its gradient: w = w - lr * dL/dw. Clear old gradients every step!'
  ],
  quiz: [
    { q: 'What mathematical rule powers backpropagation through stacked layers?',
      a: ['The calculus chain rule', 'Bayes theorem', 'Euclidean clustering', 'Matrix inversion'],
      correct: 0, why: 'Backprop factors the loss derivative with respect to early weights as a product of local layer derivatives.' },
    { q: 'What happens during the forward pass of a neural network?',
      a: ['Inputs flow layer by layer to produce predictions and compute the loss', 'Weights are updated using the learning rate', 'Old gradients are subtracted from inputs', 'Test labels are shuffled into training batches'],
      correct: 0, why: 'Forward propagation evaluates activations from input to output and caches intermediates needed for backprop.' },
    { q: 'Why must gradients be zeroed before calling backward() in PyTorch?',
      a: ['Gradients accumulate across backward calls by default', 'Zeroing gradients resets model weights to zero', 'It turns off ReLU activations', 'It skips validation'],
      correct: 0, why: 'Without zero_grad(), new gradients add onto previous batches, corrupting the update direction.' },
    { q: 'What happens if the learning rate is set far too high?',
      a: ['Updates overshoot the minimum and the loss can diverge or oscillate', 'The network automatically adds more layers', 'Training becomes perfectly smooth and instant', 'Backpropagation stops using the chain rule'],
      correct: 0, why: 'Oversized steps leap past valleys in the loss landscape, causing instability.' },
    { q: 'What is one "epoch" of neural network training?',
      a: ['One complete pass through the entire training dataset', 'A single weight update on one sample', 'Saving the final trained checkpoint', 'Evaluating one hyperparameter value'],
      correct: 0, why: 'Each epoch iterates over all mini-batches covering the full training set once.' }
  ]
};
