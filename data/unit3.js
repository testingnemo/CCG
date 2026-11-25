/* ============================================================
   COOL CODING GAME — UNIT III CONTENT: "Recurrent Neural Networks" (12h)
   Course: 26 UBAI 601 · Region: SEQUENCE RIDGE (north centre-west) — 5 locations
   Code snippets kept rare (only u3l3 includes a compact LSTM snippet).
   ============================================================ */

window.COURSE_CONTENT = window.COURSE_CONTENT || {};

/* ---- u3l1 · Sequence Modeling ---- */
COURSE_CONTENT['u3l1'] = {
  title: 'Sequence Modeling',
  topic: 'Handling ordered data where context and timing matter',
  learn: [
    'Welcome to SEQUENCE RIDGE! Unlike static photos or tables, sequential data unfolds step by step: speech, stock prices, ECG signals, and sentences.',
    'In sequences, order changes meaning: "dog bites man" is completely different from "man bites dog", and sequence lengths vary.',
    'Sequence models support one-to-many (captioning), many-to-one (sentiment), and many-to-many (translation, forecasting) mappings.'
  ],
  quiz: [
    { q: 'Why are standard fixed-size MLPs awkward for natural sequence data?',
      a: ['Sequences vary in length and depend heavily on temporal order', 'MLPs cannot multiply floating-point numbers', 'Sequences never contain more than 2 elements', 'MLPs do not support loss functions'],
      correct: 0, why: 'Standard MLPs expect fixed-width inputs and do not share parameters across time steps.' },
    { q: 'Which example represents a "many-to-one" sequence task?',
      a: ['Reading a full movie review and predicting positive or negative sentiment', 'Generating a full caption from a single photo', 'Translating English sentences into French sentences', 'Predicting a single pixel from one number'],
      correct: 0, why: 'Many input tokens map to a single sequence-level label.' },
    { q: 'What does parameter sharing across time steps achieve in sequence models?',
      a: ['The same transition rule works at any position regardless of sequence length', 'Every word gets an unrelated random network', 'Memory usage drops to zero bytes', 'Time order is discarded'],
      correct: 0, why: 'Reusing the same weights at t=1, 2, 3... lets a sequence model generalize across variable lengths.' },
    { q: 'Which of these is a "one-to-many" architecture pattern?',
      a: ['Image captioning: one image vector produces a sequence of words', 'Stock trend classification from 30 days of prices', 'Part-of-speech tagging per word', 'Binary spam detection'],
      correct: 0, why: 'A single static context vector is unrolled step-by-step into a sequence of output tokens.' },
    { q: 'In time-series splitting (train vs test), what mistake causes severe data leakage?',
      a: ['Randomly shuffling future points into the training set', 'Normalizing using training-set mean only', 'Keeping timestamps strictly chronological', 'Evaluating on unseen future weeks'],
      correct: 0, why: 'Forecasting models must only train on the past and be evaluated on strictly future intervals.' }
  ]
};

/* ---- u3l2 · Vanilla RNN & Limits ---- */
COURSE_CONTENT['u3l2'] = {
  title: 'Vanilla RNN & Limitations',
  topic: 'Hidden state recurrence, BPTT, and vanishing/exploding gradients',
  learn: [
    'A Vanilla RNN maintains a hidden state h_t updated at every step: h_t = tanh(W_hh * h_{t-1} + W_xh * x_t + b).',
    'Training unrolls the loop across time and runs Backpropagation Through Time (BPTT), multiplying the same recurrent weight matrix repeatedly.',
    'Because gradients are multiplied across T steps, they exponentially shrink (vanishing gradient—forgetting long context) or blow up (exploding gradient)!'
  ],
  quiz: [
    { q: 'What is the purpose of the hidden state h_t in a Recurrent Neural Network?',
      a: ['It acts as memory summarizing past inputs up to step t', 'It stores the dataset file path', 'It freezes all weights during training', 'It converts images into 3x3 kernels'],
      correct: 0, why: 'Passing h_{t-1} into step t lets earlier inputs influence later predictions.' },
    { q: 'Why do Vanilla RNNs struggle to remember information from 50 steps earlier?',
      a: ['Vanishing gradients shrink error signals exponentially during BPTT', 'Vanilla RNNs have no activation functions', 'They only read sequences backward', 'Hidden states reset after 3 words'],
      correct: 0, why: 'Repeated multiplication by small derivatives (<1) causes gradients from distant steps to approach zero.' },
    { q: 'What technique commonly prevents "exploding gradients" in RNN training?',
      a: ['Gradient clipping (capping gradient norm)', 'Removing all bias terms', 'Increasing the learning rate by 100x', 'Replacing hidden states with zeros'],
      correct: 0, why: 'Gradient clipping rescales gradients whenever their norm exceeds a threshold, preventing NaN blowups.' },
    { q: 'What does BPTT stand for in RNN training?',
      a: ['Backpropagation Through Time', 'Batch Pooling Tensor Transform', 'Binary Perceptron Threshold Tuning', 'Bidirectional Prediction Tree Training'],
      correct: 0, why: 'BPTT unrolls the recurrent loop across time steps and propagates gradients backward through the sequence.' },
    { q: 'Why are RNNs slower to train on very long sequences than Transformers?',
      a: ['Each step h_t depends sequentially on h_{t-1}, blocking full parallelization across time', 'RNNs cannot run on GPUs', 'RNNs require manual edge filters', 'RNNs use infinite memory per token'],
      correct: 0, why: 'The strict step-by-step recurrence prevents processing all tokens in parallel.' }
  ]
};

/* ---- u3l3 · LSTM Networks (Rare Code Milestone 3/5) ---- */
COURSE_CONTENT['u3l3'] = {
  title: 'LSTM Networks',
  topic: 'Cell state highways and forget, input, and output gates',
  python: [
    '# Practical 6: sequence modeling with LSTM',
    'lstm = nn.LSTM(input_size=64, hidden_size=128,',
    '               num_layers=2, batch_first=True)',
    'out, (h_n, c_n) = lstm(seq_x)',
    '# h_n: final hidden state, c_n: long-term cell state'
  ],
  learn: [
    'Long Short-Term Memory (LSTM) solves Vanilla RNN amnesia by adding a dedicated "cell state" conveyor belt C_t alongside hidden state h_t.',
    'Three sigmoid gates regulate flow: the Forget Gate drops stale memories, the Input Gate writes new candidates, and the Output Gate exposes relevant info.',
    'Because the cell state updates mainly via addition rather than repeated squashing, gradients flow smoothly across long sequences!'
  ],
  quiz: [
    { q: 'How does an LSTM mitigate the vanishing gradient problem?',
      a: ['An additive cell-state highway controlled by multiplicative gates preserves gradient flow', 'It removes all non-linearities from the network', 'It processes only 2 tokens per sequence', 'It replaces weights with fixed constants'],
      correct: 0, why: 'Additive cell state updates let error signals travel over many time steps without exponential decay.' },
    { q: 'What does the LSTM Forget Gate decide?',
      a: ['Which parts of the previous cell state C_{t-1} to discard or keep', 'Which training batch to delete from disk', 'How many layers the CNN should have', 'What learning rate Adam uses'],
      correct: 0, why: 'A sigmoid output near 0 forgets old state components while near 1 keeps them intact.' },
    { q: 'Which activation function do LSTM gates use to output proportions between 0 and 1?',
      a: ['Sigmoid', 'Softmax', 'ReLU', 'Step'],
      correct: 0, why: 'Sigmoid acts as a soft valve (0 = closed, 1 = open) multiplying candidate signals element-wise.' },
    { q: 'What are the two recurrent states passed from step t-1 to step t in an LSTM?',
      a: ['Hidden state (h_t) and Cell state (C_t)', 'Query (Q) and Key (K)', 'Kernel and Stride', 'Generator and Discriminator'],
      correct: 0, why: 'LSTM maintains both working hidden memory h_t and long-term cell memory C_t.' },
    { q: 'In a Bidirectional LSTM, how is each time step represented?',
      a: ['By combining states from both a forward pass and a backward pass', 'By running the same forward pass twice identically', 'By skipping every second token', 'By reversing weights after each epoch'],
      correct: 0, why: 'Bidirectional LSTMs read left-to-right and right-to-left so each token sees both past and future context.' }
  ]
};

/* ---- u3l4 · GRU Architecture ---- */
COURSE_CONTENT['u3l4'] = {
  title: 'GRU Architecture',
  topic: 'Update and reset gates — streamlined gated recurrence',
  learn: [
    'Gated Recurrent Unit (GRU) streamlines LSTM by merging cell state and hidden state into a single vector h_t.',
    'Instead of three gates, a GRU uses just two: the Update Gate (balancing old memory vs new candidate) and the Reset Gate (how much past to ignore).',
    'With fewer matrix multiplications and fewer parameters, GRUs train faster than LSTMs and often match their accuracy on medium datasets.'
  ],
  quiz: [
    { q: 'How many gates does a standard GRU cell have compared to an LSTM?',
      a: ['2 gates (update & reset) vs 3 gates in LSTM', '5 gates vs 1 gate', '0 gates vs 2 gates', 'Both have 4 identical gates'],
      correct: 0, why: 'GRU simplifies LSTM’s forget/input/output gates into an update gate and a reset gate.' },
    { q: 'How does GRU handle the separate cell state C_t found in LSTMs?',
      a: ['It merges cell state and hidden state into a single hidden state h_t', 'It stores C_t on the hard drive', 'It uses a 2D convolution instead', 'It doubles the number of cell states'],
      correct: 0, why: 'GRU operates directly on one unified hidden state h_t.' },
    { q: 'What does the GRU Update Gate control?',
      a: ['How much of the past state to carry forward versus overwrite with the new candidate', 'The number of epochs in grid search', 'The stride of MaxPooling', 'Whether dropout is active at inference'],
      correct: 0, why: 'The update gate acts like combined LSTM forget + input gates to interpolate old and new states.' },
    { q: 'When is a GRU often chosen over an LSTM?',
      a: ['When you want faster training and fewer parameters with comparable sequence performance', 'Only when modeling 2D image textures', 'When you need a Generator and Discriminator', 'When sequences have length 1'],
      correct: 0, why: 'GRUs have roughly 25% fewer parameters than LSTMs, reducing compute and overfitting risk on smaller data.' },
    { q: 'What does the Reset Gate do when its output approaches 0?',
      a: ['It lets the candidate state ignore irrelevant previous hidden history', 'It resets all network weights to random noise', 'It stops backpropagation immediately', 'It halves the batch size'],
      correct: 0, why: 'Near-zero reset values allow the cell to act as if it is reading a fresh segment of the sequence.' }
  ]
};

/* ---- u3l5 · Time-Series & NLP Apps ---- */
COURSE_CONTENT['u3l5'] = {
  title: 'Time-Series & NLP Applications',
  topic: 'Forecasting, sentiment, speech, and sequence-to-sequence models',
  learn: [
    'Recurrent networks excel wherever signals evolve over time: weather, energy load, financial ticks, and sensor telemetry.',
    'In NLP, RNNs/LSTMs powered early machine translation (encoder-decoder Seq2Seq), named-entity tagging, and speech transcription.',
    'Forecasting pipelines often use sliding windows of past steps (lookback) to predict single-step or multi-step horizons.'
  ],
  quiz: [
    { q: 'In time-series forecasting with an RNN/LSTM, what is a "sliding window"?',
      a: ['Taking the last W time steps as input to predict the next step(s)', 'Moving a 3x3 image edge kernel over RGB pixels', 'Dropping random neurons during test time', 'Shuffling future timestamps into the past'],
      correct: 0, why: 'Sliding windows turn a continuous series into supervised (past window -> future target) samples.' },
    { q: 'How did classic RNN Seq2Seq translation encode a source sentence?',
      a: ['An encoder RNN compressed the sentence into a final context vector for the decoder RNN', 'A 2D pooling layer cropped the sentence', 'A GAN discriminator translated each word independently', 'A single linear regression predicted every word'],
      correct: 0, why: 'Encoder-decoder RNNs read the input into a thought vector, then unrolled the target translation word by word.' },
    { q: 'What is "teacher forcing" when training a sequence decoder?',
      a: ['Feeding the true previous ground-truth token instead of the model’s own noisy prediction', 'Deleting the validation split', 'Freezing the encoder forever', 'Using only MSE loss on text'],
      correct: 0, why: 'Teacher forcing stabilizes and speeds up decoder training, avoiding cascading early mistakes.' },
    { q: 'Why do sequence NLP models map words to dense embedding vectors before feeding an RNN?',
      a: ['Embeddings represent semantic similarity in compact continuous space', 'One-hot vectors are too small', 'RNNs cannot accept floating-point numbers', 'Embeddings eliminate the need for training data'],
      correct: 0, why: 'Dense embeddings avoid huge sparse one-hot inputs and group semantically related words nearby.' },
    { q: 'What bottleneck plagued fixed-vector RNN encoder-decoders on long sentences?',
      a: ['Squeezing an entire long sentence into a single fixed-length vector loses early details', 'RNNs could not output punctuation', 'Batch normalization only works on 1D inputs', 'MaxPooling deleted the hidden state'],
      correct: 0, why: 'That single-vector bottleneck directly motivated the invention of the Attention Mechanism in Unit IV!' }
  ]
};
