/* ============================================================
   COOL CODING GAME — UNIT IV CONTENT: "Advanced Neural Architectures" (12h)
   Course: 26 UBAI 601 · Region: ATTENTION PEAKS (north centre-east) — 5 locations
   Code snippets kept rare (only u4l2 includes a compact Self-Attention snippet).
   ============================================================ */

window.COURSE_CONTENT = window.COURSE_CONTENT || {};

/* ---- u4l1 · Attention Mechanism ---- */
COURSE_CONTENT['u4l1'] = {
  title: 'Attention Mechanism',
  topic: 'Letting models dynamically focus on the most relevant inputs',
  learn: [
    'Welcome to ATTENTION PEAKS! Classic Seq2Seq squeezed an entire sentence into one fixed context vector—a nasty bottleneck for long inputs.',
    'Attention lets the decoder peek back at ALL encoder hidden states at every output step, assigning soft importance weights that sum to 1.',
    'Instead of memorizing everything in one cramped vector, the model aligns directly with relevant words or regions on demand!'
  ],
  quiz: [
    { q: 'What core limitation of encoder-decoder RNNs did Attention solve?',
      a: ['Compressing an entire variable-length input into one fixed-size bottleneck vector', 'ReLU dying neurons in CNNs', 'Lack of GPU drivers in 2012', 'High-resolution pooling in LeNet'],
      correct: 0, why: 'Attention lets the decoder access all encoder states dynamically instead of relying solely on the last vector.' },
    { q: 'What do attention weights represent at a decoding step?',
      a: ['A probability distribution showing how strongly to focus on each input position', 'The number of epochs left in training', 'Binary mask values that delete input tokens permanently', 'Kernel sizes in a VGG block'],
      correct: 0, why: 'Softmax-normalized attention weights sum to 1 and form a weighted average over value states.' },
    { q: 'Why do attention weights also help interpretability?',
      a: ['You can visualize which input words/regions influenced each output decision', 'They output SQL queries automatically', 'They guarantee 100% test accuracy', 'They remove all hidden layers'],
      correct: 0, why: 'Attention heatmaps show alignment between source tokens and generated outputs.' },
    { q: 'In soft attention, how is the context vector computed from encoder states?',
      a: ['As a weighted sum of encoder states using the softmax attention weights', 'By picking only the first token every time', 'By taking the max pool across channels', 'By concatenating raw JPEG headers'],
      correct: 0, why: 'Soft attention computes sum_i (alpha_i * value_i), remaining fully differentiable.' },
    { q: 'What are the three conceptual vectors used in modern Query-Key-Value attention?',
      a: ['Query (what I look for), Key (what I match against), Value (what content I retrieve)', 'Input, Bias, Stride', 'Generator, Discriminator, Critic', 'Mean, Variance, Momentum'],
      correct: 0, why: 'Queries score against Keys to weight and blend the corresponding Values.' }
  ]
};

/* ---- u4l2 · Transformers & Self-Attention (Rare Code Milestone 4/5) ---- */
COURSE_CONTENT['u4l2'] = {
  title: 'Transformers & Self-Attention',
  topic: 'Encoder-decoder stacks, scaled dot-product self-attention, and parallelism',
  python: [
    '# Practical 8: Scaled Dot-Product Self-Attention',
    'scores = (Q @ K.transpose(-2, -1)) / math.sqrt(d_k)',
    'weights = torch.softmax(scores, dim=-1)',
    'context = weights @ V   # every token attends in parallel!'
  ],
  learn: [
    '"Attention Is All You Need" (2017) replaced recurrence completely: Transformers process all tokens in parallel using Self-Attention!',
    'In Self-Attention, every token compares its Query against every token’s Key, scales by √d_k, applies Softmax, and blends the Values.',
    'Because self-attention has no built-in sequence order, Transformers add Positional Encodings, use Multi-Head Attention, and stack Encoder-Decoder blocks.'
  ],
  quiz: [
    { q: 'Why does Scaled Dot-Product Attention divide Q·Kᵀ by √d_k before Softmax?',
      a: ['To keep dot-product magnitudes stable so Softmax gradients do not vanish', 'To double the sequence length', 'To convert vectors into integers', 'To disable positional encodings'],
      correct: 0, why: 'Large d_k makes dot products grow in variance, pushing Softmax into flat regions with tiny gradients.' },
    { q: 'Why do Transformers require Positional Encodings?',
      a: ['Self-attention is permutation-equivariant and has no built-in sense of token order', 'GPUs cannot sort integers', 'Positional encodings replace activation functions', 'Without them, Softmax sums to 0'],
      correct: 0, why: 'Processing tokens in parallel treats the input like a set unless position vectors inject order.' },
    { q: 'What is the benefit of Multi-Head Attention over a single attention head?',
      a: ['Different heads can simultaneously attend to syntax, coreference, and long-range relations', 'It removes the need for training labels', 'It cuts memory to zero', 'It turns Transformers into Vanilla RNNs'],
      correct: 0, why: 'Multiple projection subspaces let the model capture diverse relationships in parallel.' },
    { q: 'In a Transformer Encoder-Decoder (e.g., translation), what does Cross-Attention do?',
      a: ['Decoder Queries attend over Encoder Keys and Values', 'Encoder tokens ignore the input sentence', 'Decoder runs without seeing the source', 'The discriminator grades fake images'],
      correct: 0, why: 'Cross-attention connects the target decoder to the encoded source representation.' },
    { q: 'Why do Transformer decoders apply a causal (look-ahead) mask during text generation?',
      a: ['To prevent position t from peeking at future tokens > t during training', 'To erase all punctuation', 'To force attention weights to equal zero everywhere', 'To convert text to RGB images'],
      correct: 0, why: 'Causal masking preserves autoregressive generation by blocking attention to future tokens.' }
  ]
};

/* ---- u4l3 · Autoencoders ---- */
COURSE_CONTENT['u4l3'] = {
  title: 'Autoencoders',
  topic: 'Unsupervised encoding, latent bottlenecks, and reconstruction',
  learn: [
    'An Autoencoder is an unsupervised architecture trained to reconstruct its own input: Encoder(x) -> z (latent code) -> Decoder(z) -> x_hat.',
    'Because the bottleneck latent space z has fewer dimensions than x, the network cannot just memorize pixels—it must compress meaningful structure!',
    'Applications include dimensionality reduction, image denoising (Denoising AE), and anomaly detection (high reconstruction error flags anomalies).'
  ],
  quiz: [
    { q: 'What are the two main components of an Autoencoder?',
      a: ['An Encoder (compresses to latent space) and a Decoder (reconstructs input)', 'A Generator and a Discriminator', 'A MaxPool and a Softmax classifier', 'An Optimizer and a Grid Search'],
      correct: 0, why: 'The Encoder maps input x to latent code z, and the Decoder maps z back toward x_hat.' },
    { q: 'Why must an undercomplete Autoencoder use a narrow bottleneck layer?',
      a: ['To prevent trivially copying the input and force learning compressed structure', 'To double the input image resolution', 'To compute cross-entropy across 1000 classes', 'To turn unsupervised data into supervised labels'],
      correct: 0, why: 'Without a bottleneck or regularization, the network could learn an uninformative identity copy.' },
    { q: 'How can an Autoencoder detect anomalies (e.g., defective parts or fraud)?',
      a: ['Anomalous inputs produce much higher reconstruction error than normal patterns', 'Anomalies always map to latent vector zero', 'Autoencoders output a direct fraud label without training', 'Reconstruction loss drops to negative values'],
      correct: 0, why: 'Trained only on normal data, the Autoencoder struggles to reconstruct unfamiliar anomalies accurately.' },
    { q: 'How is a Denoising Autoencoder trained?',
      a: ['Corrupt the input with noise and train it to reconstruct the clean original input', 'Add noise to the labels during evaluation', 'Delete the decoder after epoch 1', 'Use MSE against random Gaussian noise as target'],
      correct: 0, why: 'Recovering clean targets from noisy inputs forces the latent space to learn robust features.' },
    { q: 'Which loss function is commonly used when training an Autoencoder on continuous pixel values?',
      a: ['Reconstruction loss such as Mean Squared Error (MSE)', 'GAN adversarial minimax loss only', 'Accuracy percentage', 'K-means inertia'],
      correct: 0, why: 'MSE measures how close the reconstructed output x_hat is to the original input x.' }
  ]
};

/* ---- u4l4 · GANs: Generator vs Discriminator ---- */
COURSE_CONTENT['u4l4'] = {
  title: 'GANs: Generator & Discriminator',
  topic: 'Adversarial minimax training between counterfeiter and detective',
  learn: [
    'Generative Adversarial Networks (GANs, Goodfellow 2014) pit two neural networks against each other in a two-player minimax game.',
    'The Generator G takes random noise z and tries to synthesize realistic fake samples; the Discriminator D tries to distinguish real data from G(z).',
    'As D gets sharper at spotting flaws, G is forced via backprop through D to generate sharper, lifelike images, audio, or synthetic data!'
  ],
  quiz: [
    { q: 'What are the two competing networks in a GAN?',
      a: ['Generator (creates synthetic samples) and Discriminator (classifies real vs fake)', 'Encoder and Decoder', 'Query and Key', 'Conv2d and MaxPool'],
      correct: 0, why: 'GANs train a counterfeiter (Generator) against a detective (Discriminator).' },
    { q: 'What is the typical input to a basic GAN Generator?',
      a: ['A random latent noise vector z (e.g. Gaussian noise)', 'The ground-truth test labels only', 'A frozen VGG confusion matrix', 'The validation loss history'],
      correct: 0, why: 'Sampling different noise vectors z lets the Generator produce diverse synthetic outputs.' },
    { q: 'What does the Discriminator output?',
      a: ['The probability that a given input sample is real rather than generated', 'A 3D point cloud of the training loss', 'The optimal learning rate for Adam', 'A compressed bottleneck code z'],
      correct: 0, why: 'The Discriminator acts as a binary classifier scoring real vs fake.' },
    { q: 'What is "mode collapse" in GAN training?',
      a: ['The Generator produces only a few repetitive outputs instead of covering full data diversity', 'The Discriminator achieves 0% accuracy forever', 'The dataset shrinks to 1 image', 'All weights become NaN at epoch 0'],
      correct: 0, why: 'In mode collapse, G exploits a narrow blind spot of D by outputting nearly identical samples.' },
    { q: 'At ideal theoretical equilibrium in a standard GAN, what happens to the Discriminator?',
      a: ['Generated samples match real data so closely that D predicts 0.5 (pure guess)', 'D predicts 1.0 for fakes and 0.0 for reals', 'G stops producing outputs', 'Loss reaches +infinity'],
      correct: 0, why: 'When fake distribution equals real distribution, even an optimal Discriminator cannot tell them apart.' }
  ]
};

/* ---- u4l5 · Generative & Latent Synthesis ---- */
COURSE_CONTENT['u4l5'] = {
  title: 'Generative & Latent Mastery',
  topic: 'Comparing Attention, Transformers, Autoencoders, and GANs',
  learn: [
    'Modern Deep Learning mixes these building blocks: Vision Transformers tokenize patches, and latent generative models edit smooth latent spaces.',
    'Autoencoders excel at compression, denoising, and anomaly detection; GANs excel at sharp adversarial synthesis; Transformers dominate sequence & multimodal modeling.',
    'Stabilizing GANs uses careful learning rates, BatchNorm/SpectralNorm, and balanced G/D updates—now cross the bridge toward Deployment Citadel!'
  ],
  quiz: [
    { q: 'Which architecture is specifically trained via an adversarial two-network game?',
      a: ['GAN (Generative Adversarial Network)', 'Vanilla Autoencoder', 'LeNet-5', 'Multi-Layer Perceptron'],
      correct: 0, why: 'Adversarial Generator-vs-Discriminator competition is the defining mechanism of GANs.' },
    { q: 'Which architecture relies on Self-Attention across all tokens rather than recurrence or convolutions?',
      a: ['Transformer', 'Vanilla RNN', 'Denoising Autoencoder', 'VGG-16'],
      correct: 0, why: 'Transformers model pairwise token interactions directly with multi-head self-attention.' },
    { q: 'If your goal is unsupervised compression and reconstructing clean inputs from corrupted data, which fits best?',
      a: ['Autoencoder', 'Binary Discriminator', 'Softmax Classifier', 'Grid Search'],
      correct: 0, why: 'Autoencoders (especially Denoising Autoencoders) are built for latent compression and reconstruction.' },
    { q: 'Why is updating the Discriminator too strongly compared to the Generator risky in a GAN?',
      a: ['D becomes overconfident and G receives vanishing gradients', 'G immediately achieves mode diversity', 'Cross-entropy turns into MSE', 'Positional encodings disappear'],
      correct: 0, why: 'If D separates real and fake effortlessly, G gets little useful gradient signal to improve.' },
    { q: 'Which mechanism allows Transformers to model relationships between distant words in O(1) path length?',
      a: ['Self-Attention connecting every pair of tokens directly', 'Sequential unrolling step by step', '2x2 MaxPooling across sentences', 'Dropping 90% of hidden states'],
      correct: 0, why: 'Unlike RNNs (O(T) path length), Self-Attention links any two positions in a single matrix operation.' }
  ]
};
