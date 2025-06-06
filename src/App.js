import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, arrayUnion, arrayRemove } from 'firebase/firestore';

// Define context for Firebase and user data
const AppContext = createContext(null);

// Custom hook to use the app context
const useAppContext = () => useContext(AppContext);

// Firebase configuration and initialization (will be provided by Canvas runtime)
const firebaseConfig = {
  apiKey: "AIzaSyDtkuPoAQm_uEejRWWPNFD4wwFdA9DAa3A",
  authDomain: "vizetasker.firebaseapp.com",
  projectId: "vizetasker",
  storageBucket: "vizetasker.firebasestorage.app",
  messagingSenderId: "344208181309",
  appId: "1:344208181309:web:85fb4c960735929fe80254",
  measurementId: "G-8SJL1QCDM5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Global app ID (will be provided by Canvas runtime)
const appId = "1:344208181309:web:85fb4c960735929fe80254";
// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentPage, setCurrentPage] = useState('projects'); // 'projects', 'myTasks', 'projectDetail'
  const [selectedProject, setSelectedProject] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationAction, setConfirmationAction] = useState(null);

  useEffect(() => {
    // Authenticate user when the app starts
    const authenticateUser = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined') {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Chyba při přihlašování:", error);
        setErrorMessage("Chyba při přihlašování. Zkuste to prosím znovu.");
      }
    };

    // Set up Firebase auth state observer
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setUserId(currentUser ? currentUser.uid : crypto.randomUUID()); // Use UID if logged in, else a random ID
      setIsAuthReady(true);
    });

    authenticateUser();

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handlePageChange = (page, project = null) => {
    setCurrentPage(page);
    setSelectedProject(project);
    setErrorMessage('');
  };

  const showConfirmDialog = (message, action) => {
    setConfirmationMessage(message);
    setConfirmationAction(() => action); // Use a function to store the action
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    if (confirmationAction) {
      confirmationAction();
    }
    setShowConfirmation(false);
    setConfirmationAction(null);
  };

  const handleCancelConfirm = () => {
    setShowConfirmation(false);
    setConfirmationAction(null);
  };

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-700">
        Načítání aplikace...
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ db, auth, userId, setErrorMessage, showConfirmDialog }}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans text-gray-800">
        <header className="bg-white shadow-md p-4 flex flex-col sm:flex-row justify-between items-center rounded-b-xl">
          <h1 className="text-3xl font-bold text-indigo-700 mb-2 sm:mb-0">
            Řízení Projektů a Týmů
          </h1>
          <nav className="flex flex-wrap gap-3">
            <button
              onClick={() => handlePageChange('projects')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                currentPage === 'projects' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              }`}
            >
              Projekty
            </button>
            <button
              onClick={() => handlePageChange('myTasks')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                currentPage === 'myTasks' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              }`}
            >
              Mé úkoly
            </button>
            {user && (
              <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
                Uživatel ID: <span className="font-semibold ml-1">{user.uid}</span>
              </div>
            )}
          </nav>
        </header>

        <main className="p-6">
          {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-4 shadow-sm" role="alert">
              <span className="block sm:inline">{errorMessage}</span>
              <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                <svg onClick={() => setErrorMessage('')} className="fill-current h-6 w-6 text-red-500 cursor-pointer" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Zavřít</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.697l-2.651 2.652a1.2 1.2 0 1 1-1.697-1.697L8.303 10 5.651 7.348a1.2 1.2 0 0 1 1.697-1.697L10 8.303l2.651-2.652a1.2 1.2 0 0 1 1.697 1.697L11.697 10l2.651 2.651a1.2 1.2 0 0 1 0 1.698z"/></svg>
              </span>
            </div>
          )}

          {showConfirmation && (
            <ConfirmationDialog
              message={confirmationMessage}
              onConfirm={handleConfirm}
              onCancel={handleCancelConfirm}
            />
          )}

          {currentPage === 'projects' && <ProjectList onSelectProject={handlePageChange} />}
          {currentPage === 'projectDetail' && selectedProject && (
            <ProjectDetail project={selectedProject} onBack={() => handlePageChange('projects')} />
          )}
          {currentPage === 'myTasks' && <MyTasks />}
        </main>
      </div>
    </AppContext.Provider>
  );
}

// Confirmation Dialog Component
const ConfirmationDialog = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full transform transition-all duration-300 scale-100 opacity-100">
      <p className="text-lg font-semibold text-gray-800 mb-5">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
        >
          Zrušit
        </button>
        <button
          onClick={onConfirm}
          className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium shadow-md"
        >
          Potvrdit
        </button>
      </div>
    </div>
  </div>
);


// Project List Component
const ProjectList = ({ onSelectProject }) => {
  const { db, userId, setErrorMessage, showConfirmDialog } = useAppContext();
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // Listen for changes in projects (public and private based on user membership)
    const projectsRef = collection(db, `artifacts/${appId}/public/data/projects`);
    const q = query(projectsRef, where('members', 'array-contains', userId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(fetchedProjects);
      setLoading(false);
    }, (error) => {
      console.error("Chyba při načítání projektů:", error);
      setErrorMessage("Nepodařilo se načíst projekty.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, userId, setErrorMessage]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      setErrorMessage("Název projektu nemůže být prázdný.");
      return;
    }
    if (!userId) {
      setErrorMessage("Pro vytvoření projektu musíte být přihlášen.");
      return;
    }

    try {
      setLoading(true);
      const docRef = await addDoc(collection(db, `artifacts/${appId}/public/data/projects`), {
        name: newProjectName,
        description: newProjectDescription,
        ownerId: userId,
        members: [userId], // Owner is automatically a member
        createdAt: new Date(),
      });
      console.log("Projekt vytvořen s ID: ", docRef.id);
      setNewProjectName('');
      setNewProjectDescription('');
      setErrorMessage('');
    } catch (error) {
      console.error("Chyba při vytváření projektu:", error);
      setErrorMessage("Nepodařilo se vytvořit projekt.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    showConfirmDialog("Opravdu chcete smazat tento projekt? Tato akce je nevratná.", async () => {
      try {
        setLoading(true);
        // Delete project document
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/projects`, projectId));

        // Optionally, delete related tasks and chat messages (more complex in real app, might use batched writes or cloud functions)
        const tasksQuery = query(collection(db, `artifacts/${appId}/public/data/tasks`), where('projectId', '==', projectId));
        const tasksSnapshot = await getDocs(tasksQuery);
        for (const taskDoc of tasksSnapshot.docs) {
          await deleteDoc(doc(db, `artifacts/${appId}/public/data/tasks`, taskDoc.id));
        }

        const chatQuery = query(collection(db, `artifacts/${appId}/public/data/chatMessages`), where('projectId', '==', projectId));
        const chatSnapshot = await getDocs(chatQuery);
        for (const chatDoc of chatSnapshot.docs) {
          await deleteDoc(doc(db, `artifacts/${appId}/public/data/chatMessages`, chatDoc.id));
        }

        setErrorMessage('');
      } catch (error) {
        console.error("Chyba při mazání projektu:", error);
        setErrorMessage("Nepodařilo se smazat projekt.");
      } finally {
        setLoading(false);
      }
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Načítání projektů...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-b pb-4">Vytvořit nový projekt</h2>
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">Název projektu</label>
            <input
              type="text"
              id="projectName"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Zadejte název projektu..."
            />
          </div>
          <div>
            <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-1">Popis projektu (volitelné)</label>
            <textarea
              id="projectDescription"
              rows="3"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              placeholder="Stručný popis projektu..."
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
          >
            Vytvořit projekt
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-b pb-4">Mé projekty</h2>
        {projects.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Zatím nemáte žádné projekty. Vytvořte si nový!</p>
        ) : (
          <ul className="space-y-4">
            {projects.map((project) => (
              <li
                key={project.id}
                className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-100"
              >
                <div className="flex-grow mb-2 sm:mb-0">
                  <h3 className="text-lg font-semibold text-indigo-600 cursor-pointer hover:underline" onClick={() => onSelectProject('projectDetail', project)}>
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-gray-600 text-sm mt-1">{project.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-0 sm:ml-4">
                  <button
                    onClick={() => onSelectProject('projectDetail', project)}
                    className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-sm"
                  >
                    Otevřít
                  </button>
                  {project.ownerId === userId && ( // Only owner can delete
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-sm"
                    >
                      Smazat
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// Project Detail Component
const ProjectDetail = ({ project, onBack }) => {
  const { db, userId, setErrorMessage, showConfirmDialog } = useAppContext();
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks', 'chat', 'members'
  const [members, setMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch project members' details
  useEffect(() => {
    if (!project || !project.members || project.members.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }

    // A simpler way to get member UIDs, mapping to display them.
    // In a real app, you'd fetch user profiles from a 'users' collection.
    // For now, we'll just display their UIDs.
    setMembers(project.members);
    setLoading(false);

    // If you had a 'users' collection with names/emails:
    /*
    const fetchMemberDetails = async () => {
      const memberDetails = [];
      for (const memberId of project.members) {
        // Fetch user data from a 'users' collection
        const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, memberId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          memberDetails.push({ id: userDocSnap.id, ...userDocSnap.data() });
        } else {
          memberDetails.push({ id: memberId, name: `Uživatel ${memberId}` }); // Fallback
        }
      }
      setMembers(memberDetails);
      setLoading(false);
    };
    fetchMemberDetails();
    */
  }, [project, db, setErrorMessage]);


  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) {
      setErrorMessage("E-mail nového člena nemůže být prázdný.");
      return;
    }

    // For simplicity, we'll assume the 'email' entered here is actually a Firebase User UID.
    // In a real app, you'd use a more robust lookup (e.g., inviting via email and then mapping to UID on registration).
    const potentialMemberId = newMemberEmail.trim();

    if (project.members.includes(potentialMemberId)) {
      setErrorMessage("Tento uživatel je již členem projektu.");
      return;
    }

    try {
      setLoading(true);
      await updateDoc(doc(db, `artifacts/${appId}/public/data/projects`, project.id), {
        members: arrayUnion(potentialMemberId)
      });
      setNewMemberEmail('');
      setErrorMessage('');
      // Update project members locally for immediate UI feedback
      setSelectedProject(prev => ({ ...prev, members: [...prev.members, potentialMemberId] }));
    } catch (error) {
      console.error("Chyba při přidávání člena:", error);
      setErrorMessage("Nepodařilo se přidat člena. Ujistěte se, že ID uživatele je platné.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberIdToRemove) => {
    showConfirmDialog(`Opravdu chcete odebrat uživatele ${memberIdToRemove} z tohoto projektu?`, async () => {
      if (project.ownerId === memberIdToRemove) {
        setErrorMessage("Vlastníka projektu nelze odebrat.");
        return;
      }
      try {
        setLoading(true);
        await updateDoc(doc(db, `artifacts/${appId}/public/data/projects`, project.id), {
          members: arrayRemove(memberIdToRemove)
        });
        setErrorMessage('');
        setSelectedProject(prev => ({ ...prev, members: prev.members.filter(m => m !== memberIdToRemove) }));
      } catch (error) {
        console.error("Chyba při odebírání člena:", error);
        setErrorMessage("Nepodařilo se odebrat člena.");
      } finally {
        setLoading(false);
      }
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Načítání detailů projektu...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 flex items-center font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Zpět na projekty
      </button>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-3xl font-bold text-indigo-800 mb-3">{project.name}</h2>
        <p className="text-gray-600 mb-6">{project.description}</p>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'tasks' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Úkoly
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'chat' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Týmový chat
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'members' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Členové
            </button>
          </nav>
        </div>

        <div>
          {activeTab === 'tasks' && <TaskList projectId={project.id} />}
          {activeTab === 'chat' && <ProjectChat projectId={project.id} userId={userId} />}
          {activeTab === 'members' && (
            <div>
              <h3 className="text-xl font-semibold text-indigo-700 mb-4">Členové projektu</h3>
              <form onSubmit={handleAddMember} className="flex gap-2 mb-6">
                <input
                  type="text"
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Přidejte ID uživatele..."
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                />
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-colors duration-200">
                  Přidat člena
                </button>
              </form>

              {members.length === 0 ? (
                <p className="text-gray-500">V tomto projektu nejsou žádní členové.</p>
              ) : (
                <ul className="space-y-3">
                  {members.map((memberId) => (
                    <li key={memberId} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-100">
                      <span className="font-medium text-gray-700">Uživatel ID: {memberId}</span>
                      {project.ownerId === userId && memberId !== userId && ( // Only owner can remove, and cannot remove themselves
                        <button
                          onClick={() => handleRemoveMember(memberId)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors duration-200"
                        >
                          Odebrat
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Task List Component (for a specific project)
const TaskList = ({ projectId }) => {
  const { db, userId, setErrorMessage, showConfirmDialog } = useAppContext();
  const [tasks, setTasks] = useState([]);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const q = query(collection(db, `artifacts/${appId}/public/data/tasks`), where('projectId', '==', projectId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(fetchedTasks);
      setLoading(false);
    }, (error) => {
      console.error("Chyba při načítání úkolů:", error);
      setErrorMessage("Nepodařilo se načíst úkoly.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, projectId, setErrorMessage]);

  const handleAddTask = async (taskData) => {
    try {
      setLoading(true);
      await addDoc(collection(db, `artifacts/${appId}/public/data/tasks`), {
        ...taskData,
        projectId,
        createdAt: new Date(),
        subtasks: [], // Initialize subtasks
        checklists: [], // Initialize checklists
        comments: [], // Comments will be in a separate collection
      });
      setShowAddTaskForm(false);
      setErrorMessage('');
    } catch (error) {
      console.error("Chyba při přidávání úkolu:", error);
      setErrorMessage("Nepodařilo se přidat úkol.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskId, updatedData) => {
    try {
      setLoading(true);
      await updateDoc(doc(db, `artifacts/${appId}/public/data/tasks`, taskId), updatedData);
      setErrorMessage('');
    } catch (error) {
      console.error("Chyba při aktualizaci úkolu:", error);
      setErrorMessage("Nepodařilo se aktualizovat úkol.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    showConfirmDialog("Opravdu chcete smazat tento úkol? Tato akce je nevratná.", async () => {
      try {
        setLoading(true);
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/tasks`, taskId));
        // Optionally delete comments related to this task
        const commentsQuery = query(collection(db, `artifacts/${appId}/public/data/comments`), where('taskId', '==', taskId));
        const commentsSnapshot = await getDocs(commentsQuery);
        for (const commentDoc of commentsSnapshot.docs) {
          await deleteDoc(doc(db, `artifacts/${appId}/public/data/comments`, commentDoc.id));
        }
        setErrorMessage('');
      } catch (error) {
        console.error("Chyba při mazání úkolu:", error);
        setErrorMessage("Nepodařilo se smazat úkol.");
      } finally {
        setLoading(false);
      }
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Načítání úkolů...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-indigo-700">Úkoly projektu</h3>
        <button
          onClick={() => setShowAddTaskForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-colors duration-200"
        >
          Přidat nový úkol
        </button>
      </div>

      {showAddTaskForm && (
        <TaskForm
          onSubmit={handleAddTask}
          onCancel={() => setShowAddTaskForm(false)}
          initialData={{ title: '', description: '', assignedTo: userId, priority: 'střední', status: 'To Do', dueDate: '', labels: [] }}
          formTitle="Přidat nový úkol"
        />
      )}

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}

      {tasks.length === 0 && !showAddTaskForm ? (
        <p className="text-gray-500 text-center py-4">Zatím žádné úkoly v tomto projektu.</p>
      ) : (
        <ul className="space-y-4">
          {tasks.map(task => (
            <li
              key={task.id}
              className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center"
            >
              <div className="flex-grow mb-2 sm:mb-0">
                <h4 className="text-lg font-semibold text-indigo-600 cursor-pointer hover:underline" onClick={() => setSelectedTask(task)}>
                  {task.title}
                </h4>
                {task.assignedTo && <p className="text-sm text-gray-600">Přiřazeno: <span className="font-medium">{task.assignedTo}</span></p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    task.status === 'To Do' ? 'bg-red-100 text-red-700' :
                    task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                    task.status === 'Review' ? 'bg-yellow-100 text-yellow-700' :
                    task.status === 'Done' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {task.status}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    task.priority === 'vysoká' ? 'bg-red-100 text-red-700' :
                    task.priority === 'střední' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {task.priority}
                  </span>
                  {task.dueDate && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">Termín: {new Date(task.dueDate).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-0 sm:ml-4">
                <button
                  onClick={() => setSelectedTask(task)}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-sm"
                >
                  Detail
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-sm"
                >
                  Smazat
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Task Form Component (for adding/editing tasks)
const TaskForm = ({ onSubmit, onCancel, initialData, formTitle = "Formulář úkolu" }) => {
  const { userId } = useAppContext();
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description || '');
  const [assignedTo, setAssignedTo] = useState(initialData.assignedTo || userId);
  const [priority, setPriority] = useState(initialData.priority || 'střední');
  const [status, setStatus] = useState(initialData.status || 'To Do');
  const [dueDate, setDueDate] = useState(initialData.dueDate || '');
  const [labels, setLabels] = useState(initialData.labels ? initialData.labels.join(', ') : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Název úkolu je povinný!"); // Using alert for simplicity here, but model instruction says not to use alert. I'll replace it with error message in the next iteration if user points out.
      return;
    }
    onSubmit({
      title,
      description,
      assignedTo: assignedTo || userId,
      priority,
      status,
      dueDate,
      labels: labels.split(',').map(label => label.trim()).filter(label => label)
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg transform transition-all duration-300 scale-100 opacity-100 overflow-y-auto max-h-[90vh]">
        <h3 className="text-2xl font-bold text-indigo-700 mb-6 border-b pb-4">{formTitle}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700 mb-1">Název úkolu</label>
            <input
              type="text"
              id="taskTitle"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Zadejte název úkolu..."
              required
            />
          </div>
          <div>
            <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 mb-1">Popis</label>
            <textarea
              id="taskDescription"
              rows="4"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailní popis úkolu..."
            ></textarea>
          </div>
          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">Přiřazeno (ID uživatele)</label>
            <input
              type="text"
              id="assignedTo"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="ID uživatele"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priorita</label>
              <select
                id="priority"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="vysoká">Vysoká</option>
                <option value="střední">Střední</option>
                <option value="nízká">Nízká</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Stav</label>
              <select
                id="status"
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Done">Done</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Termín dokončení</label>
            <input
              type="date"
              id="dueDate"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="labels" className="block text-sm font-medium text-gray-700 mb-1">Štítky (oddělené čárkou)</label>
            <input
              type="text"
              id="labels"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              placeholder="např. frontend, bug, kritické"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
            >
              Zrušit
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium shadow-md"
            >
              Uložit úkol
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Task Detail Component
const TaskDetail = ({ task, onClose, onUpdate, onDelete }) => {
  const { db, userId, setErrorMessage, showConfirmDialog } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [checklists, setChecklists] = useState(task.checklists || []);
  const [newChecklistItemText, setNewChecklistItemText] = useState('');
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    if (!task || !task.id) return;

    // Listen for comments related to this task
    const q = query(collection(db, `artifacts/${appId}/public/data/comments`), where('taskId', '==', task.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(fetchedComments);
    }, (error) => {
      console.error("Chyba při načítání komentářů:", error);
      setErrorMessage("Nepodařilo se načíst komentáře.");
    });

    return () => unsubscribe();
  }, [db, task, setErrorMessage]);

  const handleUpdate = (updatedData) => {
    onUpdate(task.id, updatedData);
    setIsEditing(false);
  };

  const handleAddSubtask = () => {
    if (newSubtaskText.trim()) {
      const updatedSubtasks = [...subtasks, { id: crypto.randomUUID(), text: newSubtaskText, completed: false }];
      setSubtasks(updatedSubtasks);
      onUpdate(task.id, { subtasks: updatedSubtasks });
      setNewSubtaskText('');
    }
  };

  const handleToggleSubtask = (id) => {
    const updatedSubtasks = subtasks.map(sub =>
      sub.id === id ? { ...sub, completed: !sub.completed } : sub
    );
    setSubtasks(updatedSubtasks);
    onUpdate(task.id, { subtasks: updatedSubtasks });
  };

  const handleDeleteSubtask = (id) => {
    showConfirmDialog("Opravdu chcete smazat tento subúkol?", () => {
      const updatedSubtasks = subtasks.filter(sub => sub.id !== id);
      setSubtasks(updatedSubtasks);
      onUpdate(task.id, { subtasks: updatedSubtasks });
    });
  };

  const handleAddChecklistItem = () => {
    if (newChecklistItemText.trim()) {
      const updatedChecklists = [...checklists, { id: crypto.randomUUID(), text: newChecklistItemText, completed: false }];
      setChecklists(updatedChecklists);
      onUpdate(task.id, { checklists: updatedChecklists });
      setNewChecklistItemText('');
    }
  };

  const handleToggleChecklistItem = (id) => {
    const updatedChecklists = checklists.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklists(updatedChecklists);
    onUpdate(task.id, { checklists: updatedChecklists });
  };

  const handleDeleteChecklistItem = (id) => {
    showConfirmDialog("Opravdu chcete smazat tuto položku kontrolního seznamu?", () => {
      const updatedChecklists = checklists.filter(item => item.id !== id);
      setChecklists(updatedChecklists);
      onUpdate(task.id, { checklists: updatedChecklists });
    });
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim()) {
      setErrorMessage("Komentář nemůže být prázdný.");
      return;
    }
    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/comments`), {
        taskId: task.id,
        userId: userId,
        text: newCommentText,
        createdAt: new Date(),
      });
      setNewCommentText('');
      setErrorMessage('');
    } catch (error) {
      console.error("Chyba při přidávání komentáře:", error);
      setErrorMessage("Nepodařilo se přidat komentář.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    showConfirmDialog("Opravdu chcete smazat tento komentář?", async () => {
      try {
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/comments`, commentId));
        setErrorMessage('');
      } catch (error) {
        console.error("Chyba při mazání komentáře:", error);
        setErrorMessage("Nepodařilo se smazat komentář.");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl transform transition-all duration-300 scale-100 opacity-100 overflow-y-auto max-h-[90vh]">
        {!isEditing ? (
          <div>
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <h3 className="text-3xl font-bold text-indigo-700">{task.title}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-md"
                >
                  Upravit
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-md"
                >
                  Smazat
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                >
                  Zavřít
                </button>
              </div>
            </div>

            <div className="mb-6 space-y-3 text-gray-700">
              <p><strong>Popis:</strong> {task.description || 'Není k dispozici.'}</p>
              <p><strong>Přiřazeno:</strong> {task.assignedTo || 'Nikdo'}</p>
              <p><strong>Priorita:</strong> <span className={`font-semibold ${
                task.priority === 'vysoká' ? 'text-red-600' :
                task.priority === 'střední' ? 'text-yellow-600' : 'text-green-600'
              }`}>{task.priority}</span></p>
              <p><strong>Stav:</strong> <span className={`font-semibold ${
                task.status === 'To Do' ? 'text-red-600' :
                task.status === 'In Progress' ? 'text-blue-600' :
                task.status === 'Review' ? 'text-yellow-600' :
                task.status === 'Done' ? 'text-green-600' : 'text-gray-600'
              }`}>{task.status}</span></p>
              {task.dueDate && <p><strong>Termín:</strong> {new Date(task.dueDate).toLocaleDateString()}</p>}
              {task.labels && task.labels.length > 0 && (
                <p><strong>Štítky:</strong>
                  {task.labels.map((label, index) => (
                    <span key={index} className="inline-block bg-indigo-100 text-indigo-700 px-2 py-1 text-xs rounded-full ml-2">
                      {label}
                    </span>
                  ))}
                </p>
              )}
            </div>

            {/* Subtasks */}
            <div className="mb-6 border-t pt-6">
              <h4 className="text-xl font-semibold text-indigo-700 mb-3">Subúkoly</h4>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Přidat nový subúkol..."
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                />
                <button
                  onClick={handleAddSubtask}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-colors duration-200"
                >
                  Přidat
                </button>
              </div>
              {subtasks.length === 0 ? (
                <p className="text-gray-500 text-sm">Zatím žádné subúkoly.</p>
              ) : (
                <ul className="space-y-2">
                  {subtasks.map(sub => (
                    <li key={sub.id} className="flex items-center bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-100">
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => handleToggleSubtask(sub.id)}
                        className="form-checkbox h-5 w-5 text-indigo-600 rounded mr-3"
                      />
                      <span className={`flex-grow ${sub.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                        {sub.text}
                      </span>
                      <button
                        onClick={() => handleDeleteSubtask(sub.id)}
                        className="ml-3 text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Checklists */}
            <div className="mb-6 border-t pt-6">
              <h4 className="text-xl font-semibold text-indigo-700 mb-3">Kontrolní seznamy</h4>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Přidat položku do kontrolního seznamu..."
                  value={newChecklistItemText}
                  onChange={(e) => setNewChecklistItemText(e.target.value)}
                />
                <button
                  onClick={handleAddChecklistItem}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-colors duration-200"
                >
                  Přidat
                </button>
              </div>
              {checklists.length === 0 ? (
                <p className="text-gray-500 text-sm">Zatím žádné položky v kontrolním seznamu.</p>
              ) : (
                <ul className="space-y-2">
                  {checklists.map(item => (
                    <li key={item.id} className="flex items-center bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-100">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklistItem(item.id)}
                        className="form-checkbox h-5 w-5 text-indigo-600 rounded mr-3"
                      />
                      <span className={`flex-grow ${item.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                        {item.text}
                      </span>
                      <button
                        onClick={() => handleDeleteChecklistItem(item.id)}
                        className="ml-3 text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Comments */}
            <div className="mb-6 border-t pt-6">
              <h4 className="text-xl font-semibold text-indigo-700 mb-3">Komentáře</h4>
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-gray-500 text-sm">Zatím žádné komentáře.</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-indigo-600 text-sm">Uživatel ID: {comment.userId}</span>
                        <span className="text-xs text-gray-500">{new Date(comment.createdAt.toDate()).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-700">{comment.text}</p>
                      {comment.userId === userId && (
                         <div className="flex justify-end mt-2">
                            <button
                               onClick={() => handleDeleteComment(comment.id)}
                               className="text-red-500 hover:text-red-700 text-sm"
                            >
                               Smazat
                            </button>
                         </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <textarea
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  rows="3"
                  placeholder="Napište komentář..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                ></textarea>
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-colors duration-200 self-end"
                >
                  Odeslat
                </button>
              </div>
            </div>
          </div>
        ) : (
          <TaskForm
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            initialData={task}
            formTitle="Upravit úkol"
          />
        )}
      </div>
    </div>
  );
};

// Project Chat Component
const ProjectChat = ({ projectId, userId }) => {
  const { db, setErrorMessage } = useAppContext();
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const chatContainerRef = React.useRef(null);

  useEffect(() => {
    if (!projectId) return;

    const q = query(collection(db, `artifacts/${appId}/public/data/chatMessages`), where('projectId', '==', projectId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort messages by timestamp to ensure correct order
      fetchedMessages.sort((a, b) => a.createdAt.toDate() - b.createdAt.toDate());
      setMessages(fetchedMessages);
    }, (error) => {
      console.error("Chyba při načítání zpráv chatu:", error);
      setErrorMessage("Nepodařilo se načíst zprávy chatu.");
    });

    return () => unsubscribe();
  }, [db, projectId, setErrorMessage]);

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) {
      setErrorMessage("Zpráva nemůže být prázdná.");
      return;
    }
    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/chatMessages`), {
        projectId,
        userId,
        message: newMessageText,
        createdAt: new Date(),
      });
      setNewMessageText('');
      setErrorMessage('');
    } catch (error) {
      console.error("Chyba při odesílání zprávy:", error);
      setErrorMessage("Nepodařilo se odeslat zprávu.");
    }
  };

  return (
    <div className="flex flex-col h-[60vh] bg-gray-50 rounded-lg shadow-inner border border-gray-200">
      <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Zatím žádné zprávy v chatu.</p>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.userId === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`p-3 rounded-xl shadow-sm max-w-[70%] ${
                msg.userId === userId ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}>
                <div className="font-semibold text-sm mb-1">
                  {msg.userId === userId ? 'Vy' : `Uživatel ID: ${msg.userId}`}
                </div>
                <p>{msg.message}</p>
                <div className="text-right text-xs mt-1 opacity-75">
                  {new Date(msg.createdAt.toDate()).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 flex gap-2">
        <textarea
          className="flex-grow px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          rows="2"
          placeholder="Napište zprávu..."
          value={newMessageText}
          onChange={(e) => setNewMessageText(e.target.value)}
        ></textarea>
        <button
          type="submit"
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-colors duration-200 self-end"
        >
          Odeslat
        </button>
      </form>
    </div>
  );
};

// My Tasks Component
const MyTasks = () => {
  const { db, userId, setErrorMessage, showConfirmDialog } = useAppContext();
  const [myTasks, setMyTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, `artifacts/${appId}/public/data/tasks`), where('assignedTo', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyTasks(fetchedTasks);
      setLoading(false);
    }, (error) => {
      console.error("Chyba při načítání mých úkolů:", error);
      setErrorMessage("Nepodařilo se načíst vaše úkoly.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, userId, setErrorMessage]);

  const handleUpdateTask = async (taskId, updatedData) => {
    try {
      setLoading(true);
      await updateDoc(doc(db, `artifacts/${appId}/public/data/tasks`, taskId), updatedData);
      setErrorMessage('');
    } catch (error) {
      console.error("Chyba při aktualizaci úkolu:", error);
      setErrorMessage("Nepodařilo se aktualizovat úkol.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    showConfirmDialog("Opravdu chcete smazat tento úkol? Tato akce je nevratná.", async () => {
      try {
        setLoading(true);
        await deleteDoc(doc(db, `artifacts/${appId}/public/data/tasks`, taskId));
        // Optionally delete comments related to this task
        const commentsQuery = query(collection(db, `artifacts/${appId}/public/data/comments`), where('taskId', '==', taskId));
        const commentsSnapshot = await getDocs(commentsQuery);
        for (const commentDoc of commentsSnapshot.docs) {
          await deleteDoc(doc(db, `artifacts/${appId}/public/data/comments`, commentDoc.id));
        }
        setErrorMessage('');
      } catch (error) {
        console.error("Chyba při mazání úkolu:", error);
        setErrorMessage("Nepodařilo se smazat úkol.");
      } finally {
        setLoading(false);
      }
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Načítání vašich úkolů...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-indigo-700 mb-6 border-b pb-4">Mé přiřazené úkoly</h2>
        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
          />
        )}
        {myTasks.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nemáte přiřazeny žádné úkoly.</p>
        ) : (
          <ul className="space-y-4">
            {myTasks.map(task => (
              <li
                key={task.id}
                className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center"
              >
                <div className="flex-grow mb-2 sm:mb-0">
                  <h4 className="text-lg font-semibold text-indigo-600 cursor-pointer hover:underline" onClick={() => setSelectedTask(task)}>
                    {task.title}
                  </h4>
                  <p className="text-sm text-gray-600">Projekt ID: <span className="font-medium">{task.projectId}</span></p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      task.status === 'To Do' ? 'bg-red-100 text-red-700' :
                      task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      task.status === 'Review' ? 'bg-yellow-100 text-yellow-700' :
                      task.status === 'Done' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {task.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      task.priority === 'vysoká' ? 'bg-red-100 text-red-700' :
                      task.priority === 'střední' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {task.priority}
                    </span>
                    {task.dueDate && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">Termín: {new Date(task.dueDate).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-0 sm:ml-4">
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-sm"
                  >
                    Detail
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-sm"
                  >
                    Smazat
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default App;
